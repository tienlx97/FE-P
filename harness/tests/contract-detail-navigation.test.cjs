const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const root = path.resolve(__dirname, '..', '..');

test('contract detail provides back navigation and closes its edit drawer on cancel', () => {
  const workspaceSource = fs.readFileSync(
    path.join(
      root,
      'src/features/logistics-contracts/components/contract-detail-workspace.jsx',
    ),
    'utf8',
  );
  const dialogSource = fs.readFileSync(
    path.join(
      root,
      'src/features/logistics-contracts/components/contract-form-dialog.jsx',
    ),
    'utf8',
  );

  const breadcrumbSource = fs.readFileSync(
    path.join(root, 'src/shared/components/custom/meta/contract-header-card.jsx'),
    'utf8',
  );

  // Back navigation lives in the Meta breadcrumb's back link (Figma
  // node 89:1065): history back when the previous page is in the app,
  // else the trail's parent (`useBackNavigation`), never a dead end.
  assert.match(workspaceSource, /<MetaContractBreadcrumb/);
  assert.match(workspaceSource, /trail=\{contractTrail\(/);
  assert.match(breadcrumbSource, /useBackNavigation\(trail\.fallbackHref\)/);
  assert.match(workspaceSource, /initialMode="edit"\s+closeOnCancel/);
  assert.match(dialogSource, /closeOnCancel \|\| !contract \? 'close' : 'cancel'/);
});
