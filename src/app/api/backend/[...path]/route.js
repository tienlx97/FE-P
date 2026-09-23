import { cookies } from 'next/headers';

import { clientAddressHeaders } from '@/shared/api/client-address.js';
import {
  sessionClaimsFromToken,
  writeSessionCookies,
} from '@/shared/api/server-session.js';
import { resolveApiBaseUrl } from '@/shared/config/api-config.js';
import {
  ACCESS_TOKEN_KEY,
  REFRESH_TOKEN_KEY,
} from '@/shared/config/session-keys.js';

/**
 * Backend-for-frontend proxy.
 *
 * The browser calls `/api/backend/api/v1/...` on this origin; this handler
 * attaches the bearer token from the **HttpOnly** session cookie and forwards
 * the request to the .NET API.
 *
 * Why it exists: the access token used to live in a cookie that JavaScript
 * could read, so any XSS — including one in a third-party dependency — could
 * lift it and impersonate the user for the life of the token (the API's
 * docs/security.md, H-4). Making the cookie HttpOnly means client code can no
 * longer attach the token itself, so the token has to be attached somewhere
 * the browser cannot reach: here.
 *
 * It also refreshes silently. Access tokens last 60 minutes; rather than
 * bouncing the user to the login page every hour, a 401 triggers one refresh
 * attempt and a replay of the original request. The client never sees it.
 *
 * Two things fall out for free — the browser never makes a cross-origin
 * request, so CORS stops being involved at all, and the backend's address is
 * no longer baked into the client bundle.
 */

const HOP_BY_HOP = new Set([
  'connection',
  'keep-alive',
  'transfer-encoding',
  'upgrade',
  'host',
  'content-length',
  // Not hop-by-hop, but deliberately dropped: the browser's cookie header
  // carries our HttpOnly session cookies. The API authenticates from the
  // Authorization header alone and has no business receiving them.
  'cookie',
]);

/** Never proxied — refreshing a refresh call would recurse. */
const REFRESH_PATH = 'api/v1/authentication/refresh';

/**
 * @param {Request} request
 * @param {{ params: Promise<{ path: string[] }> }} context
 */
async function proxy(request, context) {
  const { path } = await context.params;
  const cookieStore = await cookies();

  const url = new URL(request.url);
  const target = `${resolveApiBaseUrl()}/${path.join('/')}${url.search}`;

  const headers = new Headers();
  request.headers.forEach((value, name) => {
    if (!HOP_BY_HOP.has(name.toLowerCase())) {
      headers.set(name, value);
    }
  });

  // Always set by us, never forwarded from the client — a caller must not be
  // able to present their own Authorization header through the proxy.
  headers.delete('authorization');

  // Likewise ours to set: the API sees every request coming from this server,
  // so anything it partitions per client (rate limits, logs) needs the real
  // address. It only believes the header from proxies it trusts.
  headers.delete('x-forwarded-for');
  for (const [name, value] of Object.entries(clientAddressHeaders(request))) {
    headers.set(name, value);
  }

  // Buffered up front so the request can be replayed after a refresh; a
  // stream can only be consumed once.
  const body = ['GET', 'HEAD'].includes(request.method)
    ? undefined
    : await request.arrayBuffer();

  const accessToken = cookieStore.get(ACCESS_TOKEN_KEY)?.value;

  let response = await forward(
    target,
    request.method,
    headers,
    body,
    accessToken,
  );

  if (response === null) {
    return badGateway();
  }

  const canRetry = response.status === 401 && path.join('/') !== REFRESH_PATH;

  if (canRetry) {
    const refreshed = await refreshAccessToken(cookieStore);

    if (refreshed !== null) {
      const retried = await forward(
        target,
        request.method,
        headers,
        body,
        refreshed,
      );

      if (retried === null) {
        return badGateway();
      }

      response = retried;
    }
  }

  const responseHeaders = new Headers();
  const contentType = response.headers.get('content-type');
  if (contentType) {
    responseHeaders.set('content-type', contentType);
  }
  const retryAfter = response.headers.get('retry-after');
  if (retryAfter) {
    responseHeaders.set('retry-after', retryAfter);
  }

  return new Response(response.body, {
    status: response.status,
    headers: responseHeaders,
  });
}

/**
 * @param {string} target
 * @param {string} method
 * @param {Headers} headers
 * @param {ArrayBuffer | undefined} body
 * @param {string | undefined} accessToken
 * @returns {Promise<Response | null>} null when the backend is unreachable.
 */
async function forward(target, method, headers, body, accessToken) {
  const outgoing = new Headers(headers);

  if (accessToken) {
    outgoing.set('Authorization', `Bearer ${accessToken}`);
  }

  try {
    return await fetch(target, {
      method,
      headers: outgoing,
      body,
      redirect: 'manual',
      cache: 'no-store',
    });
  } catch {
    return null;
  }
}

/**
 * In-flight refreshes, keyed by the refresh token being redeemed.
 *
 * A page load fires several requests at once; when the access token expires
 * they all 401 together and would each redeem the same token. The backend
 * tolerates that (it has a short reuse leeway for exactly this race), but
 * there is no reason to make N calls when one will do — and the calls that
 * lose the race waste a round trip and burn tokens in the family.
 *
 * Per server instance, so this narrows the window rather than closing it;
 * the backend's leeway is what actually makes the race safe.
 *
 * @type {Map<string, Promise<string | null>>}
 */
const inFlightRefreshes = new Map();

/**
 * Redeems the refresh token for a new access token and writes both back.
 *
 * Refresh tokens are single-use and rotated, so the replacement must be
 * persisted — dropping it would leave the session holding a token the backend
 * has already spent.
 *
 * @param {Awaited<ReturnType<typeof cookies>>} cookieStore
 * @returns {Promise<string | null>} the new access token, or null if the
 *   session could not be renewed (the caller then returns the original 401 and
 *   the client-side api-client sends the user to `/login`).
 */
async function refreshAccessToken(cookieStore) {
  const refreshToken = cookieStore.get(REFRESH_TOKEN_KEY)?.value;

  if (!refreshToken) {
    return null;
  }

  const existing = inFlightRefreshes.get(refreshToken);
  if (existing) {
    return existing;
  }

  const attempt = redeem(cookieStore, refreshToken).finally(() => {
    inFlightRefreshes.delete(refreshToken);
  });

  inFlightRefreshes.set(refreshToken, attempt);

  return attempt;
}

/**
 * @param {Awaited<ReturnType<typeof cookies>>} cookieStore
 * @param {string} refreshToken
 * @returns {Promise<string | null>}
 */
async function redeem(cookieStore, refreshToken) {
  let response;
  try {
    response = await fetch(`${resolveApiBaseUrl()}/${REFRESH_PATH}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ RefreshToken: refreshToken }),
      cache: 'no-store',
    });
  } catch {
    return null;
  }

  if (!response.ok) {
    return null;
  }

  const session = await response.json().catch(() => null);

  if (typeof session?.token !== 'string') {
    return null;
  }

  // Roles and permissions are re-derived from the new token: a refresh can
  // legitimately change them (an Admin grant rotates the security stamp, so
  // the next token carries different claims), and stale cookies would leave
  // the nav showing the old ones.
  writeSessionCookies(cookieStore, {
    token: session.token,
    refreshToken: session.refreshToken,
    ...sessionClaimsFromToken(session.token),
  });

  return session.token;
}

function badGateway() {
  return Response.json(
    {
      title: 'Bad Gateway',
      status: 502,
      detail: 'Không thể kết nối đến máy chủ',
    },
    { status: 502 },
  );
}

export const GET = proxy;
export const POST = proxy;
export const PUT = proxy;
export const PATCH = proxy;
export const DELETE = proxy;

// The proxied data is per-user and must never be cached or prerendered.
export const dynamic = 'force-dynamic';
