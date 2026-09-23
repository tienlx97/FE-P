const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const root = path.resolve(__dirname, '..', '..');

test('contract list keeps advanced search while exposing Stitch view modes', () => {
  const listSource = fs.readFileSync(
    path.join(
      root,
      'src/features/logistics-contracts/components/contracts-list.jsx',
    ),
    'utf8',
  );
  const configSource = fs.readFileSync(
    path.join(root, 'src/features/logistics-contracts/config/contracts-table.js'),
    'utf8',
  );

  assert.match(listSource, /advancedFilterConditions=\{filterConditions\}/);
  assert.match(listSource, /onAdvancedFilterChange=\{setFilterConditions\}/);
  assert.match(listSource, /<TabList[\s\S]*role="tablist"/);
  assert.match(listSource, /value: 'Draft', label: 'Bản nháp'/);
  assert.match(listSource, /<MetaCountBadge\s+value=\{tabCounts\[tab\.value\]\}/);
  assert.match(listSource, /condition\.field !== 'status'/);
  assert.match(listSource, /condition\.field !== 'contractType'/);
  assert.match(listSource, /viewPresetsInHeader/);
  assert.match(listSource, /Thời gian: Năm \$\{year\}/);
  assert.match(
    listSource,
    /Tìm nhanh theo mã HĐ, tên dự án, khách hàng, số vận đơn B\/L/,
  );
  assert.match(configSource, /label: 'Cơ bản'/);
  assert.match(configSource, /label: 'Giá trị & Dòng tiền'/);
  assert.match(
    configSource,
    /FINANCIAL_COLUMN_KEYS = \[\s*'createdDate',\s*'contractNumber',\s*'status',\s*'projectCompletionDate',/,
  );
  assert.doesNotMatch(
    configSource.match(/FINANCIAL_COLUMN_KEYS = \[[\s\S]*?\];/)?.[0] ?? '',
    /'buyer'|'unexportedValue'/,
  );
});

test('Meta Contract list is the main /logistics/contracts route', () => {
  const routeSource = fs.readFileSync(
    path.join(root, 'src/app/(protected)/logistics/contracts/page.jsx'),
    'utf8',
  );
  assert.match(routeSource, /MetaThemeProvider/);
  assert.match(routeSource, /<ContractsList \/>/);
  assert.equal(
    fs.existsSync(
      path.join(root, 'src/app/(protected)/logistics/contracts/v2/page.jsx'),
    ),
    false,
  );

  const sidebarSource = fs.readFileSync(
    path.join(root, 'src/sidebarLogistics.json'),
    'utf8',
  );
  assert.doesNotMatch(sidebarSource, /Hợp đồng V2/);
});

test('financial view carries the Figma logistics-cost, container and paid-progress columns', () => {
  const root = path.resolve(__dirname, '../..');
  const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
  const table = read('src/features/logistics-contracts/config/contracts-table.js');
  const list = read('src/features/logistics-contracts/components/contracts-list.jsx');

  for (const key of ['containerCount', 'logisticsSale', 'logisticsCost']) {
    assert.match(table, new RegExp(`'${key}'`));
    assert.match(list, new RegExp(`key: '${key}'`));
  }
  assert.match(list, /CHI PHÍ LOGISTICS/);
  assert.match(list, /useContractPrivateInfosListQuery/);
  assert.match(list, /<ProgressBar/);
});
