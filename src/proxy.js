import { NextResponse } from 'next/server';

import { parsePermissionsCookie } from './shared/api/jwt.js';
import { routeAccessRules } from './shared/config/route-access.js';
import {
  ACCESS_TOKEN_KEY,
  SESSION_PERMISSIONS_KEY,
} from './shared/config/session-keys.js';

/**
 * Route-level permission gate. Layered on top of `(protected)/layout.jsx`'s
 * existing "has a token at all" check, which owns the logged-out case —
 * this middleware only acts once a token is present, for the (today:
 * empty) set of paths in `routeAccessRules` that need a *specific*
 * permission beyond just being logged in. Checks an abstract permission
 * string, not a role name — see `shared/config/route-access.js`.
 *
 * Must live at `src/middleware.js` (this project uses a `src/` directory) —
 * a root-level `middleware.js` silently isn't picked up by Next 16.
 * Next 16.2.11 also deprecates the `middleware.js` file convention in favor
 * of `proxy.js` (same export, just a rename — see
 * https://nextjs.org/docs/messages/middleware-to-proxy); not renamed yet
 * since `middleware.js` still works today, just emits a deprecation
 * warning in the dev server log.
 * @param {import('next/server').NextRequest} request
 */
export function proxy(request) {
  const { pathname } = request.nextUrl;
  const matchedRule = routeAccessRules.find(
    (rule) =>
      pathname === rule.pathPrefix ||
      pathname.startsWith(`${rule.pathPrefix}/`),
  );

  if (!matchedRule) {
    return NextResponse.next();
  }

  // No token at all: let the request through unchanged. `(protected)/
  // layout.jsx` still owns redirecting a logged-out visitor to `/login` —
  // duplicating that redirect here would just be two sources of truth for
  // the same behavior.
  const token = request.cookies.get(ACCESS_TOKEN_KEY)?.value;
  if (!token) {
    return NextResponse.next();
  }

  const permissions = parsePermissionsCookie(
    request.cookies.get(SESSION_PERMISSIONS_KEY)?.value,
  );
  const hasAllowedPermission = matchedRule.allowedPermissions.some(
    (permission) => permissions.includes(permission),
  );

  if (!hasAllowedPermission) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  return NextResponse.next();
}

// `/api/*` is left out: the rules only gate pages, and a request that goes
// through the proxy has its body buffered up to `proxyClientMaxBodySize`
// (10 MB) — a larger backup uploaded to `/api/backend/.../backups/upload`
// reached the API cut short ("Unexpected end of Stream", 400).
export const config = {
  matcher: ['/((?!api/|_next/static|_next/image|favicon.ico).*)'],
};
