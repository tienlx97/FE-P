import {
  ACCESS_TOKEN_KEY,
  REFRESH_TOKEN_KEY,
  SESSION_COOKIE_MAX_AGE_SECONDS,
  SESSION_DISPLAY_NAME_KEY,
  SESSION_EMPLOYEE_CODE_KEY,
  SESSION_PERMISSIONS_KEY,
  SESSION_ROLES_KEY,
} from '../config/session-keys.js';
import { decodeJwtPayload } from './jwt.js';
import { normalizePermissions, normalizeRoles } from './jwt.js';

/**
 * Server-only session cookie handling, shared by `/api/session` (login and
 * logout) and `/api/backend` (silent refresh).
 *
 * Nothing here may be imported from client code: it is the only place the
 * access and refresh tokens are handled, and both live in `HttpOnly` cookies
 * precisely so the browser cannot reach them (the API's docs/security.md, H-4).
 */

const isProduction = process.env.NODE_ENV === 'production';

// `Secure` cookies require HTTPS, which the TLS-fronted deployment
// (`docker-compose.prod.yml` + nginx) always has in production — but a
// plain-HTTP LAN deployment (`next start` run directly, no TLS terminator;
// see BE-kt-xnk's own LAN model) still sets `NODE_ENV=production` and would
// otherwise get a cookie the browser silently refuses to store. Set
// `COOKIE_SECURE=false` in that deployment's `.env` to opt out; unset,
// nothing changes for the TLS-fronted deployment.
const secureCookies = process.env.COOKIE_SECURE === 'false' ? false : isProduction;

/**
 * The access-token cookie expires exactly when the token does, so a stale
 * cookie can never make the app look signed in against a dead token. The rest
 * of the session outlives it — the refresh token is what can still produce a
 * working access token.
 * @param {string} token
 */
function accessTokenMaxAge(token) {
  const payload = decodeJwtPayload(token);
  const expiresAt = typeof payload?.exp === 'number' ? payload.exp : null;

  if (expiresAt === null) {
    return null;
  }

  const seconds = expiresAt - Math.floor(Date.now() / 1000);

  return seconds > 0 ? seconds : null;
}

/**
 * @param {import('next/dist/compiled/@edge-runtime/cookies').RequestCookies |
 *   Awaited<ReturnType<typeof import('next/headers').cookies>>} cookieStore
 * @param {{ token: string, refreshToken?: string | null, employeeCode?: string,
 *   displayName?: string, roles?: string[], permissions?: string[] }} session
 * @returns {boolean} false when the access token is already expired.
 */
export function writeSessionCookies(cookieStore, session) {
  const { token, refreshToken, employeeCode, displayName, roles, permissions } = session;

  const maxAge = accessTokenMaxAge(token);
  if (maxAge === null) {
    return false;
  }

  const sessionCookie = {
    path: '/',
    sameSite: /** @type {const} */ ('lax'),
    secure: secureCookies,
    maxAge: SESSION_COOKIE_MAX_AGE_SECONDS,
  };

  cookieStore.set(ACCESS_TOKEN_KEY, token, {
    ...sessionCookie,
    maxAge,
    httpOnly: true,
  });

  if (refreshToken) {
    cookieStore.set(REFRESH_TOKEN_KEY, refreshToken, {
      ...sessionCookie,
      httpOnly: true,
    });
  }

  // Not HttpOnly and not secrets: the header and nav render from these on the
  // client, and the backend re-authorises every request from the signed access
  // token regardless of what the browser claims here.
  //
  // Only written when supplied, so a silent refresh (which carries no profile
  // payload) leaves them untouched instead of blanking them.
  if (employeeCode !== undefined) {
    cookieStore.set(SESSION_EMPLOYEE_CODE_KEY, employeeCode, sessionCookie);
  }
  if (displayName !== undefined) {
    cookieStore.set(SESSION_DISPLAY_NAME_KEY, displayName, sessionCookie);
  }
  if (roles !== undefined) {
    cookieStore.set(SESSION_ROLES_KEY, JSON.stringify(roles), sessionCookie);
  }
  if (permissions !== undefined) {
    cookieStore.set(SESSION_PERMISSIONS_KEY, JSON.stringify(permissions), sessionCookie);
  }

  return true;
}

/**
 * Re-derives roles and permissions from a freshly issued access token. A
 * refresh can legitimately change them — an Admin promotion rotates the
 * security stamp, so the next token carries the new claims — and leaving the
 * old cookies in place would show stale navigation.
 * @param {string} token
 */
export function sessionClaimsFromToken(token) {
  const payload = decodeJwtPayload(token);

  return {
    roles: normalizeRoles(payload),
    permissions: normalizePermissions(payload),
  };
}

/**
 * @param {Awaited<ReturnType<typeof import('next/headers').cookies>>} cookieStore
 */
export function clearSessionCookies(cookieStore) {
  for (const key of [
    ACCESS_TOKEN_KEY,
    REFRESH_TOKEN_KEY,
    SESSION_EMPLOYEE_CODE_KEY,
    SESSION_DISPLAY_NAME_KEY,
    SESSION_ROLES_KEY,
    SESSION_PERMISSIONS_KEY,
  ]) {
    cookieStore.set(key, '', {
      path: '/',
      maxAge: 0,
      sameSite: 'lax',
      secure: secureCookies,
    });
  }
}
