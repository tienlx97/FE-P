/**
 * @typedef {Object} NavLink
 * @property {string} label
 * @property {string} href
 * @property {NavLink[]} [children]
 * @property {string[]} [allowedPermissions] - Omitted: visible to any
 *   logged-in visitor (today's default for every link). Present: only
 *   visible to a visitor whose session permissions intersect this list —
 *   see `src/shared/api/nav.js`'s `filterNavLinksByPermissions`. Checks an
 *   abstract permission string (e.g. `'logistics:view'`), not a role name —
 *   the backend alone maps role → permission (`RolePermissions.Map`), so
 *   renaming a department there never requires an FE change.
 */

/**
 * React Docs-compatible sidebar registry item. `allowedPermissions` mirrors
 * `NavLink`'s field of the same name (see above) — omitted means visible to
 * any logged-in visitor; present means only one whose session permissions
 * intersect it, via `src/shared/api/nav.js`'s
 * `filterSidebarRoutesByPermissions`.
 * @typedef {{
 *   title?: string,
 *   path?: string,
 *   routes?: SidebarRouteItem[],
 *   hasSectionHeader?: boolean,
 *   sectionHeader?: string,
 *   allowedPermissions?: string[],
 * }} SidebarRouteItem
 */

/** @typedef {SidebarRouteItem & { title: string, path: string, routes: SidebarRouteItem[] }} SidebarRouteTree */

/**
 * What a logged-in session persists as cookies — see
 * `src/shared/api/session-cookies.js`.
 * @typedef {Object} Session
 * @property {string} token
 * @property {string} [refreshToken]
 * @property {string} nationalId
 * @property {string} displayName
 * @property {string[]} roles
 * @property {string[]} permissions
 */

export {};
