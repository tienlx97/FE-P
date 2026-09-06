/**
 * Route-level permission gating, enforced by `src/middleware.js` before a
 * matching page ever renders (same "block before render" property
 * `(protected)/layout.jsx` already gives the plain login check). Checks an
 * abstract permission string, not a role name — the backend alone maps
 * role → permission (`BE-kt-xnk`'s `RolePermissions.Map`), so renaming a
 * department there never requires an FE change here.
 *
 * `pathPrefix` matches the route itself and every sub-route under it, same
 * semantics as `isNavLinkActive` in `src/shared/api/nav.js`. Order matters:
 * `middleware.js` takes the *first* matching rule, so a more specific
 * prefix (e.g. `/logistics/contracts`) must be listed before a broader one
 * it is nested under (`/logistics`) — otherwise the broader rule always
 * wins and the specific permission never gets checked.
 * @type {Array<{ pathPrefix: string, allowedPermissions: string[] }>}
 */
export const routeAccessRules = [
  { pathPrefix: '/admin', allowedPermissions: ['users:manage'] },
  {
    pathPrefix: '/logistics/contracts-overview',
    allowedPermissions: ['logistics:contracts:view'],
  },
  {
    pathPrefix: '/logistics/contracts',
    allowedPermissions: ['logistics:contracts:view'],
  },
  {
    pathPrefix: '/logistics/shipments',
    allowedPermissions: ['logistics:contracts:view'],
  },
  {
    pathPrefix: '/logistics/commission',
    allowedPermissions: ['logistics:contracts:view'],
  },
  {
    pathPrefix: '/logistics/commissions',
    allowedPermissions: ['logistics:contracts:view'],
  },
  {
    pathPrefix: '/logistics/customers',
    allowedPermissions: ['logistics:contracts:view'],
  },
  {
    pathPrefix: '/logistics/countries',
    allowedPermissions: ['logistics:contracts:view'],
  },
  {
    pathPrefix: '/logistics/places',
    allowedPermissions: ['logistics:contracts:view'],
  },
  {
    pathPrefix: '/logistics/config',
    allowedPermissions: ['logistics:contracts:view'],
  },
  { pathPrefix: '/logistics', allowedPermissions: ['logistics:view'] },
];
