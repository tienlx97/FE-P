/** @typedef {import('../types/index.js').NavLink} NavLink */

export const site = {
  name: 'Đại Nghĩa Group',
  description:
    'Cổng thông tin nội bộ Đại Nghĩa Group — nơi tra cứu quy định, hướng dẫn và tài liệu dùng chung cho toàn hệ sinh thái.',
  slogan: 'Kiến tạo giá trị — Phát triển bền vững',
};

// Every entry below is visible to any logged-in visitor today. To restrict
// one to a specific permission, add `allowedPermissions: ['logistics:view']`
// (see `NavLink`'s typedef and `src/shared/api/nav.js`'s
// `filterNavLinksByPermissions`) — e.g. once a real `/logistics` page
// exists: `{ label: 'Logistics', href: '/logistics', allowedPermissions:
// ['logistics:view'] }`. Permission strings must match `BE-kt-xnk`'s
// `RolePermissions.Map` — that map, not this file, decides which roles
// grant which permission.
/** @type {NavLink[]} */
export const navLinks = [
  { label: 'Tin tức', href: '/news' },
  { label: 'Tài liệu', href: '/docs' },
  {
    label: 'Logistics',
    href: '/logistics',
    allowedPermissions: ['logistics:view'],
  },
  {
    label: 'Kế toán',
    href: '/accounting',
    allowedPermissions: ['accounting:contracts:view'],
  },
  {
    label: 'Quản trị',
    href: '/admin',
    allowedPermissions: ['users:manage'],
  },
  { label: 'Đăng nhập', href: '/login' },
];

/** @type {NavLink[]} */
export const topNavLinks = navLinks.filter(({ href }) =>
  ['/news', '/docs', '/logistics', '/accounting', '/admin'].includes(href),
);
