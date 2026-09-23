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

  // Back navigation lives in the Meta breadcrumb's back link (Figma
  // node 89:1065) and still goes back in history, not to a fixed URL.
  assert.match(workspaceSource, /<MetaContractBreadcrumb/);
  assert.match(workspaceSource, /onBack=\{\(\) => router\.back\(\)\}/);
  assert.match(workspaceSource, /initialMode="edit"\s+closeOnCancel/);
  assert.match(dialogSource, /closeOnCancel \|\| !contract \? 'close' : 'cancel'/);
});
