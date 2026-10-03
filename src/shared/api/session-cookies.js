import {
  SESSION_DISPLAY_NAME_KEY,
  SESSION_EMPLOYEE_CODE_KEY,
  SESSION_PERMISSIONS_KEY,
  SESSION_ROLES_KEY,
} from '../config/session-keys.js';
import { parsePermissionsCookie, parseRolesCookie } from './jwt.js';

/**
 * Client-side view of the session.
 *
 * The access token is deliberately absent from this module: it lives in an
 * HttpOnly cookie that JavaScript cannot read (docs/security.md, H-4), and it
 * is attached to outgoing requests by the `/api/backend` proxy rather than by
 * anything here. What remains are the non-secret display values the header and
 * nav render from.
 *
 * Both writes and deletes are performed by the `/api/session` route handler,
 * since only the server can set or clear an HttpOnly cookie.
 */

// The native `storage` event only fires in *other* tabs, never the tab that
// made the write — so components subscribed via useSyncExternalStore (e.g.
// the header's user menu, which lives in the persistent layout and doesn't
// naturally re-render on same-tab client-side navigation) need an explicit
// same-tab signal after login/logout.
export const SESSION_CHANGE_EVENT = 'kt-xnk-session-change';

/** @param {string} name */
function readCookie(name) {
  if (typeof document === 'undefined') {
    return null;
  }
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

export function readSessionEmployeeCode() {
  return readCookie(SESSION_EMPLOYEE_CODE_KEY) ?? '';
}

export function readSessionDisplayName() {
  return readCookie(SESSION_DISPLAY_NAME_KEY) ?? '';
}

/**
 * Whether a session is present, judged from a readable companion cookie — the
 * token itself is HttpOnly and cannot be inspected here. The two are written
 * and cleared together by `/api/session`, and the backend is the real
 * authority either way: a forged display cookie buys nothing, since every
 * request is authorised from the signed token server-side.
 */
export function hasSessionCookie() {
  return readCookie(SESSION_EMPLOYEE_CODE_KEY) !== null;
}

/** @returns {string[]} */
export function readSessionRoles() {
  return parseRolesCookie(readCookie(SESSION_ROLES_KEY));
}

/** @returns {string[]} */
export function readSessionPermissions() {
  return parsePermissionsCookie(readCookie(SESSION_PERMISSIONS_KEY));
}

export async function clearSession() {
  let response;
  try {
    response = await fetch('/api/session', { method: 'DELETE' });
  } catch {
    return false;
  }

  if (!response.ok) return false;

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event(SESSION_CHANGE_EVENT));
  }
  return true;
}

export { clearSession as clearClientSessionCookies };
