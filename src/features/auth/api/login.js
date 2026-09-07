const GENERIC_ERROR_MESSAGE = 'Sai số CCCD hoặc mật khẩu';
const RATE_LIMITED_MESSAGE = 'Bạn đã thử quá nhiều lần. Vui lòng đợi ít phút rồi thử lại.';

/**
 * Signs in via this app's own `/api/session/login` route handler, which calls
 * the backend server-side and stores the session as `HttpOnly` cookies.
 *
 * **No token is returned here, deliberately.** The client used to receive the
 * access and refresh tokens and hand them to `/api/session` to be stored — so
 * for that moment they lived in JavaScript memory, reachable by an XSS hooking
 * `fetch`, which undercut the point of `HttpOnly` cookies (the API's
 * docs/security.md). Now the tokens never leave the server.
 *
 * Also not routed through `shared/api/api-client.js`: that client treats `401`
 * as "your session expired" and redirects to `/login`. Here `401` means "wrong
 * national ID or password", on a page that already *is* `/login`.
 *
 * @param {import('../types/index.js').LoginFormValues} values
 * @returns {Promise<import('../types/index.js').LoginResult>}
 */
export async function login({ nationalId, password }) {
  let response;
  try {
    response = await fetch('/api/session/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nationalId, password }),
    });
  } catch {
    return { success: false, message: 'Không thể kết nối đến máy chủ' };
  }

  if (!response.ok) {
    const problem = await response.json().catch(() => null);

    if (response.status === 429) {
      return { success: false, message: RATE_LIMITED_MESSAGE };
    }

    return { success: false, message: problem?.detail ?? GENERIC_ERROR_MESSAGE };
  }

  const body = await response.json();

  return { success: true, displayName: body.displayName };
}
