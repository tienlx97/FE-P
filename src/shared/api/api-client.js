import { API_PROXY_PREFIX } from '../config/api-config.js';
import { clearClientSessionCookies } from './session-cookies.js';

/**
 * The one place that turns a backend HTTP response into a result the UI can
 * act on.
 *
 * Two things it owns:
 *
 * **Credentials.** Requests go to this app's own `/api/backend` proxy, which
 * attaches the bearer token from the HttpOnly session cookie server-side.
 * Nothing here — and nothing in any feature — ever handles a token, because
 * client JavaScript can no longer read one (docs/security.md, H-4).
 *
 * **The 401/403 distinction.** The backend separates them (see the API's
 * `openspec/changes/fix-401-vs-403-authentication/`):
 *
 * - `401` — not signed in: no token, expired token, revoked session.
 *   The session is dead; clear it and send the user to `/login`.
 * - `403` — signed in, but lacking the required role. Say so; do NOT bounce
 *   the user to the login page, signing in again will not help.
 */

export const SESSION_EXPIRED_MESSAGE =
  'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.';
export const SIGNED_IN_ELSEWHERE_MESSAGE =
  'Tài khoản đã được đăng nhập ở thiết bị khác.';
export const SESSION_REVOKED_MESSAGE =
  'Phiên đăng nhập đã bị thu hồi. Vui lòng đăng nhập lại.';

/** The API's `detail` when a newer sign-in displaced this session. */
const SUPERSEDED_DETAIL = 'Signed in on another device';
const REVOKED_DETAIL = 'Session has been revoked; sign in again';

export const SESSION_ELSEWHERE_QUERY_PARAM = 'elsewhere';
export const SESSION_REVOKED_QUERY_PARAM = 'revoked';
export const FORBIDDEN_MESSAGE =
  'Bạn không có quyền thực hiện thao tác này.';
export const RATE_LIMITED_MESSAGE =
  'Bạn đã thử quá nhiều lần. Vui lòng đợi ít phút rồi thử lại.';
export const NETWORK_ERROR_MESSAGE = 'Không thể kết nối đến máy chủ';

export const SESSION_EXPIRED_QUERY_PARAM = 'expired';
const LOGIN_PATH = '/login';

/**
 * Ends the dead session and sends the browser to the login page.
 *
 * A full-page navigation rather than a router push, deliberately: the token is
 * gone, so every cached React Query result and every server-rendered fragment
 * on the current page is now unauthorised. Reloading throws all of that away
 * instead of leaving stale privileged data on screen.
 * @param {'expired' | 'elsewhere' | 'revoked'} reason
 */
async function handleSessionExpired(reason) {
  if (typeof window === 'undefined') {
    return;
  }

  await clearClientSessionCookies();

  // Already on the login page — nothing to redirect to, and redirecting again
  // would loop.
  if (window.location.pathname === LOGIN_PATH) {
    return;
  }

  // Which of the two is carried through, because they mean different things to
  // the user: an expiry is routine, whereas "someone signed into your account
  // elsewhere" is either you on another machine or the first sign that it is
  // not you at all.
  const queryParam = {
    elsewhere: SESSION_ELSEWHERE_QUERY_PARAM,
    revoked: SESSION_REVOKED_QUERY_PARAM,
    expired: SESSION_EXPIRED_QUERY_PARAM,
  }[reason];

  window.location.assign(`${LOGIN_PATH}?${queryParam}=1`);
}

/**
 * @typedef {object} ApiRequestOptions
 * @property {string} [method] Defaults to `GET`.
 * @property {unknown} [body] JSON-serialised when present, unless it is a
 *   `FormData` — sent as-is so the browser sets the multipart boundary
 *   itself (used for file uploads, e.g. backups).
 * @property {string} [errorMessage] Fallback shown when the backend sends no
 *   usable `detail`.
 * @property {boolean} [redirectOnSessionExpiry] Defaults to `true`.
 */

/**
 * @template T
 * @typedef {{ success: true, data: T }
 *   | { success: false, status: number | null, message: string, sessionExpired: boolean }
 * } ApiResult
 */

/**
 * @template T
 * @param {string} path Backend path, e.g. `/api/v1/users`.
 * @param {ApiRequestOptions} [options]
 * @returns {Promise<ApiResult<T>>}
 */
export async function apiRequest(path, options = {}) {
  const {
    method = 'GET',
    body,
    errorMessage = 'Đã xảy ra lỗi, vui lòng thử lại',
    redirectOnSessionExpiry = true,
  } = options;

  const isFormData = typeof FormData !== 'undefined' && body instanceof FormData;

  /** @type {Record<string, string>} */
  const headers = {};
  if (body !== undefined && !isFormData) {
    headers['Content-Type'] = 'application/json';
  }

  let response;
  try {
    response = await fetch(`${API_PROXY_PREFIX}${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : isFormData ? body : JSON.stringify(body),
    });
  } catch {
    return {
      success: false,
      status: null,
      message: NETWORK_ERROR_MESSAGE,
      sessionExpired: false,
    };
  }

  if (response.ok) {
    return { success: true, data: await readJson(response) };
  }

  if (response.status === 401) {
    const problem = await response.json().catch(() => null);
    const signedInElsewhere = problem?.detail === SUPERSEDED_DETAIL;
    const sessionRevoked = problem?.detail === REVOKED_DETAIL;
    const sessionEndReason = signedInElsewhere
      ? 'elsewhere'
      : sessionRevoked
        ? 'revoked'
        : 'expired';

    if (redirectOnSessionExpiry) {
      await handleSessionExpired(sessionEndReason);
    }

    return {
      success: false,
      status: 401,
      message: signedInElsewhere
        ? SIGNED_IN_ELSEWHERE_MESSAGE
        : sessionRevoked
          ? SESSION_REVOKED_MESSAGE
          : SESSION_EXPIRED_MESSAGE,
      sessionExpired: true,
    };
  }

  if (response.status === 403) {
    // The backend's `detail` here is English and phrased for developers
    // ("User is forbidden from taking this action") — not something to show a
    // Vietnamese-speaking user.
    return {
      success: false,
      status: 403,
      message: FORBIDDEN_MESSAGE,
      sessionExpired: false,
    };
  }

  if (response.status === 429) {
    return {
      success: false,
      status: 429,
      message: RATE_LIMITED_MESSAGE,
      sessionExpired: false,
    };
  }

  const problem = await response.json().catch(() => null);

  return {
    success: false,
    status: response.status,
    message: problem?.detail ?? errorMessage,
    sessionExpired: false,
  };
}

/**
 * `204 No Content` and an empty body are successes with nothing to parse —
 * `response.json()` would throw on both.
 * @param {Response} response
 */
async function readJson(response) {
  if (response.status === 204) {
    return null;
  }

  return response.json().catch(() => null);
}
