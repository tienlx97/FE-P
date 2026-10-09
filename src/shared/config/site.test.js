import assert from 'node:assert/strict';
import { test } from 'node:test';

import { navLinks, site, topNavLinks } from './site.js';

test('site config has a name and description', () => {
  assert.ok(site.name.length > 0);
  assert.ok(site.description.length > 0);
});

test('navLinks each have a label and href', () => {
  assert.ok(navLinks.length > 0);
  for (const link of navLinks) {
    assert.ok(link.label.length > 0);
    assert.ok(link.href.startsWith('/'));
  }
});

test('topNavLinks exposes Tin tức, Tài liệu, Logistics, Kế toán, and Quản trị', () => {
  assert.deepEqual(
    topNavLinks.map(({ label, href }) => ({ label, href })),
    [
      { label: 'Tin tức', href: '/news' },
      { label: 'Tài liệu', href: '/docs' },
      { label: 'Logistics', href: '/logistics' },
      { label: 'Kế toán', href: '/accounting' },
      { label: 'Quản trị', href: '/admin' },
    ],
  );
});

test('the Quản trị link is gated behind the users:manage permission', () => {
  const adminLink = topNavLinks.find(({ href }) => href === '/admin');
  assert.deepEqual(adminLink?.allowedPermissions, ['users:manage']);
});

test('the Logistics link is gated behind the logistics:view permission', () => {
  const logisticsLink = topNavLinks.find(({ href }) => href === '/logistics');
  assert.deepEqual(logisticsLink?.allowedPermissions, ['logistics:view']);
});

test('the Kế toán link is gated behind the accounting:contracts:view permission', () => {
  const accountingLink = topNavLinks.find(({ href }) => href === '/accounting');
  assert.deepEqual(accountingLink?.allowedPermissions, [
    'accounting:contracts:view',
  ]);
});
