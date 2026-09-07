import { cookies } from 'next/headers';

import { clientAddressHeaders } from '@/shared/api/client-address.js';
import {
  sessionClaimsFromToken,
  writeSessionCookies,
} from '@/shared/api/server-session.js';
import { resolveApiBaseUrl } from '@/shared/config/api-config.js';

/**
 * Signs in **entirely server-side**.
 *
 * The browser posts credentials here and gets back a display name; the access
 * and refresh tokens never leave this process. Previously the client called
 * the backend through the proxy, read both tokens out of the JSON response,
 * and posted them to `/api/session` to be stored — so for that moment they sat
 * in JavaScript memory, where an XSS hooking `fetch` could take them. That
 * narrowed the value of making the cookies `HttpOnly` in the first place
 * (the API's docs/security.md, "Điểm còn yếu").
 *
 * Credentials still pass through the browser, of course — the user types them.
 * The point is that the long-lived session material does not.
 */

/** @param {Request} request */
export async function POST(request) {
  let credentials;
  try {
    credentials = await request.json();
  } catch {
    return Response.json({ detail: 'Malformed request' }, { status: 400 });
  }

  const { nationalId, password } = credentials ?? {};

  if (typeof nationalId !== 'string' || typeof password !== 'string') {
    return Response.json({ detail: 'Thiếu số CCCD hoặc mật khẩu' }, { status: 400 });
  }

  let response;
  try {
    response = await fetch(`${resolveApiBaseUrl()}/api/v1/authentication/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Without this the API rate-limits every sign-in against this server's
        // address, i.e. one shared bucket for the whole user base.
        ...clientAddressHeaders(request),
      },
      body: JSON.stringify({ NationalId: nationalId, Password: password }),
      cache: 'no-store',
    });
  } catch {
    return Response.json({ detail: 'Không thể kết nối đến máy chủ' }, { status: 502 });
  }

  const body = await response.json().catch(() => null);

  if (!response.ok) {
    // Pass the backend's own status through — 401 is "sai số CCCD hoặc
    // mật khẩu" and 429 is "quá nhiều lần thử", and the form distinguishes them.
    return Response.json(
      { detail: body?.detail ?? 'Đăng nhập thất bại' },
      { status: response.status },
    );
  }

  if (typeof body?.token !== 'string') {
    return Response.json({ detail: 'Phản hồi đăng nhập không hợp lệ' }, { status: 502 });
  }

  const cookieStore = await cookies();

  const stored = writeSessionCookies(cookieStore, {
    token: body.token,
    refreshToken: body.refreshToken,
    employeeCode: body.employeeCode,
    displayName: `${body.firstName ?? ''} ${body.lastName ?? ''}`.trim(),
    ...sessionClaimsFromToken(body.token),
  });

  if (!stored) {
    return Response.json(
      { detail: 'Máy chủ cấp token đã hết hạn' },
      { status: 502 },
    );
  }

  // Deliberately no tokens in this response — only what the UI shows.
  return Response.json({
    ok: true,
    displayName: `${body.firstName ?? ''} ${body.lastName ?? ''}`.trim(),
  });
}

export const dynamic = 'force-dynamic';
