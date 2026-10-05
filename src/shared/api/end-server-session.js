import { ACCESS_TOKEN_KEY, REFRESH_TOKEN_KEY } from '../config/session-keys.js';
import { clearSessionCookies } from './server-session.js';

/**
 * Keep the revocation credential until the backend confirms logout. A retry
 * is safe even if the previous response was lost: backend logout is idempotent.
 * @param {Awaited<ReturnType<typeof import('next/headers').cookies>>} cookieStore
 * @param {string} apiBaseUrl
 */
export async function endServerSession(cookieStore, apiBaseUrl) {
  const refreshToken = cookieStore.get(REFRESH_TOKEN_KEY)?.value;
  const failure = () =>
    Response.json(
      {
        message: 'Chưa thể xác nhận thu hồi phiên. Vui lòng thử đăng xuất lại.',
      },
      { status: 503 },
    );

  // An access-only session cannot be revoked through the refresh-token endpoint.
  if (!refreshToken && cookieStore.get(ACCESS_TOKEN_KEY)?.value)
    return failure();

  if (refreshToken) {
    try {
      const response = await fetch(
        `${apiBaseUrl}/api/v1/authentication/logout`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ RefreshToken: refreshToken }),
          cache: 'no-store',
          signal: AbortSignal.timeout(10_000),
        },
      );
      if (!response.ok) return failure();
    } catch {
      return failure();
    }
  }

  clearSessionCookies(cookieStore);
  return Response.json({ ok: true });
}
