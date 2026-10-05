import { cookies } from 'next/headers';

import { endServerSession } from '@/shared/api/end-server-session.js';
import { resolveApiBaseUrl } from '@/shared/config/api-config.js';

/**
 * Ends a session. Signing *in* lives at `/api/session/login`, which never hands
 * the browser a token at all.
 *
 * There is deliberately **no `POST` here**. An earlier version accepted a
 * session payload from the client and stored it — which, besides meaning the
 * tokens had to pass through JavaScript, was an endpoint that wrote whatever
 * session it was handed. Now nothing outside this server can put a session
 * into a browser.
 */

/**
 * Signs out. Revokes the refresh token at the backend *before* clearing the
 * cookies — deleting them locally only stops this browser from using the
 * session; anyone holding a copy of the refresh token would otherwise keep a
 * working one (the API's docs/security.md, H-2).
 */
export async function DELETE() {
  const cookieStore = await cookies();
  return endServerSession(cookieStore, resolveApiBaseUrl());
}

export const dynamic = 'force-dynamic';
