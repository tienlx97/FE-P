import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

import {
  filterNavLinksByPermissions,
  filterSidebarRoutesByPermissions,
  getActiveSidebarGroupKey,
  getSidebarBreadcrumbs,
  toggleSidebarGroup,
} from './nav.js';

const sidebar = JSON.parse(
  await readFile(new URL('../../sidebarPost.json', import.meta.url), 'utf8'),
);

test('builds Docs breadcrumbs from the containing sidebar group', () => {
  assert.deepEqual(getSidebarBreadcrumbs(sidebar, '/docs/lam-them-gio'), [
    { label: 'Docs', href: '/docs', isCurrent: false },
    { label: 'Nội quy', isCurrent: true },
  ]);

  assert.deepEqual(getSidebarBreadcrumbs(sidebar, '/docs/may-tinh'), [
    { label: 'Docs', href: '/docs', isCurrent: false },
    { label: 'IT', isCurrent: true },
  ]);
});

test('returns no breadcrumbs when the route is absent from the sidebar', () => {
  assert.deepEqual(getSidebarBreadcrumbs(sidebar, '/docs/khong-ton-tai'), []);
});

test('selects only the group containing the active sidebar route', () => {
  assert.equal(
    getActiveSidebarGroupKey(sidebar.routes, '/docs/gio-lam-viec'),
    '/docs',
  );
  assert.equal(
    getActiveSidebarGroupKey(sidebar.routes, '/docs/may-tinh'),
    '/docs/it',
  );
});

test('keeps a nav link with no allowedPermissions for anyone', () => {
  const navLinks = [{ label: 'Docs', href: '/docs' }];
  assert.deepEqual(filterNavLinksByPermissions(navLinks, []), navLinks);
  assert.deepEqual(
    filterNavLinksByPermissions(navLinks, ['logistics:view']),
    navLinks,
  );
});

test('keeps a permission-restricted nav link only for a matching permission', () => {
  const navLinks = [
    {
      label: 'Logistics',
      href: '/logistics',
      allowedPermissions: ['logistics:view'],
    },
  ];

  assert.deepEqual(
    filterNavLinksByPermissions(navLinks, ['logistics:view']),
    navLinks,
  );
  assert.deepEqual(
    filterNavLinksByPermissions(navLinks, ['departments:manage']),
    [],
  );
  assert.deepEqual(filterNavLinksByPermissions(navLinks, []), []);
});

test('keeps a sidebar route with no allowedPermissions for anyone', () => {
  const routes = [{ title: 'Hợp đồng', path: '/logistics/contracts' }];
  assert.deepEqual(filterSidebarRoutesByPermissions(routes, []), routes);
});

test('keeps a permission-restricted sidebar route only for a matching permission', () => {
  const routes = [
    {
      title: 'BOQ',
      path: '/logistics/boq',
      allowedPermissions: ['logistics:secret'],
    },
  ];

  assert.deepEqual(
    filterSidebarRoutesByPermissions(routes, ['logistics:secret']),
    routes,
  );
  assert.deepEqual(
    filterSidebarRoutesByPermissions(routes, ['logistics:contracts:view']),
    [],
  );
});

test('drops a section header once every route beneath it is filtered out', () => {
  const routes = [
    { hasSectionHeader: true, sectionHeader: 'NGHIỆP VỤ' },
    {
      title: 'Hợp đồng',
      path: '/logistics/contracts',
      allowedPermissions: ['logistics:contracts:view'],
    },
    { hasSectionHeader: true, sectionHeader: 'DANH MỤC' },
    {
      title: 'Khách hàng',
      path: '/logistics/customers',
      allowedPermissions: ['logistics:contracts:view'],
    },
  ];

  assert.deepEqual(
    filterSidebarRoutesByPermissions(routes, ['logistics:contracts:view']),
    routes,
  );
  assert.deepEqual(filterSidebarRoutesByPermissions(routes, []), []);
});

test('recurses into nested sidebar route groups', () => {
  const routes = [
    {
      title: 'Nghiệp vụ',
      routes: [
        {
          title: 'BOQ',
          path: '/logistics/boq',
          allowedPermissions: ['logistics:secret'],
        },
        { title: 'Danh sách', path: '/logistics/list' },
      ],
    },
  ];

  assert.deepEqual(filterSidebarRoutesByPermissions(routes, []), [
    {
      title: 'Nghiệp vụ',
      routes: [{ title: 'Danh sách', path: '/logistics/list' }],
    },
  ]);
});

test('toggles sidebar groups as an exclusive accordion', () => {
  const pathname = '/docs/gio-lam-viec';
  const activeGroupKey = getActiveSidebarGroupKey(sidebar.routes, pathname);
  const openedSecondGroup = toggleSidebarGroup(
    null,
    pathname,
    activeGroupKey,
    '/docs/it',
  );

  assert.deepEqual(openedSecondGroup, { pathname, groupKey: '/docs/it' });
  assert.deepEqual(
    toggleSidebarGroup(openedSecondGroup, pathname, activeGroupKey, '/docs/it'),
    { pathname, groupKey: null },
  );
  assert.equal(
    getActiveSidebarGroupKey(sidebar.routes, '/docs/may-tinh'),
    '/docs/it',
  );
});
