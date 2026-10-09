/**
 * The container Excel files of the "Container & VGM" tab, built with
 * ExcelJS: the import template ("Tải tệp mẫu Excel") and the "Xuất Excel"
 * export. Both share one sheet layout — title, a description line, a band
 * naming the column groups, then the header row (cobalt, the hint of each
 * column as a cell note) frozen and repeated on printed pages, A4
 * landscape. Header texts are `BULK_CONTAINER_COLUMNS`' headers, so either
 * file imports back: the reader finds the header row
 * (`findContainerHeaderRow`) below the title block.
 *
 * The template has 100 framed rows with drop-down lists (container type,
 * carrier, depot) fed from its "Danh mục" sheet, and a "Hướng dẫn" sheet.
 * The export writes real dates and numbers, plus a G.W / VGM total.
 *
 * Takes the ExcelJS module as an argument so the caller can lazy-load it
 * and tests can pass the Node build.
 */

import { BULK_CONTAINER_COLUMNS } from './bulk-containers.js';

/**
 * @typedef {Object} ContainerExportRow
 * @property {number} sequenceNumber
 * @property {string} containerNumber
 * @property {string} typeLabel - "40'HC"
 * @property {string} sealNumber
 * @property {string} carrier
 * @property {string} depot
 * @property {string | null} packingDate - ISO date
 * @property {string} plannedPackingTime - "HH:mm" or ''
 * @property {string} actualPackingTime
 * @property {string} truckArrivalTime
 * @property {number | null} maxGross
 * @property {number | null} tare
 * @property {number | null} payload
 * @property {number | null} netWeight
 * @property {number | null} packagingWeight
 * @property {string} note
 * @property {number | null} grossWeight
 * @property {number | null} vgm
 * @property {boolean} isVgmDeclared
 */

// Meta cobalt accent and its tints; text and borders black, as in the cost
// report (no grey — user, 2026-10-08).
const COLORS = {
  accent: 'FF0064E0',
  onAccent: 'FFFFFFFF',
  band: 'FFEBF3FE',
  total: 'FFF0F5FF',
  ink: 'FF000000',
  border: 'FF000000',
  pending: 'FFB94500',
};
const FONT = 'Inter';
const FONT_SIZE = 11;
const DATE_FORMAT = 'dd/mm/yyyy';
const WEIGHT_FORMAT = '#,##0.00';
const TEMPLATE_ROW_COUNT = 100;
const HEADER_ROW = 5;

/** Column keys that must be filled, marked in the header note. */
const REQUIRED_KEYS = new Set(['containerNumber', 'containerType']);

/**
 * Column groups of the band above the header, by first / last key; a group
 * whose columns the sheet lacks (the export-only result) is skipped.
 */
const GROUPS = /** @type {const} */ ([
  ['Container', 'containerNumber', 'depotName'],
  ['Đóng hàng', 'packingDate', 'truckArrivalTime'],
  ['Khối lượng container', 'maxGross', 'payload'],
  ['Khai VGM', 'netWeight', 'packagingWeight'],
  ['Kết quả VGM', 'grossWeight', 'isVgmDeclared'],
]);

/**
 * Sheet column widths, narrower than the drawer's so the A4 printout of
 * all columns stays readable (headers wrap onto two lines).
 * @type {Record<string, number>}
 */
const WIDTHS = {
  sequenceNumber: 6,
  containerNumber: 16,
  containerType: 9,
  sealNumber: 13,
  carrierName: 26,
  depotName: 22,
  packingDate: 12,
  plannedPackingTime: 10,
  actualPackingTime: 10,
  truckArrivalTime: 10,
  maxGross: 12,
  tare: 11,
  payload: 12,
  netWeight: 12,
  packagingWeight: 12,
  note: 26,
  grossWeight: 12,
  vgm: 12,
  isVgmDeclared: 10,
};

/** Page setup of the side sheets: A4 portrait, one page wide. */
const SIDE_SHEET_PAGE = /** @type {Partial<import('exceljs').PageSetup>} */ ({
  paperSize: 9,
  orientation: 'portrait',
  fitToPage: true,
  fitToWidth: 1,
  fitToHeight: 0,
});

/** Export-only columns around the template ones. */
const EXPORT_LEAD = [{ key: 'sequenceNumber', header: 'STT' }];
const EXPORT_TAIL = [
  { key: 'grossWeight', header: 'G.W (kg)' },
  { key: 'vgm', header: 'VGM (kg)' },
  { key: 'isVgmDeclared', header: 'Đã khai VGM' },
];

const WEIGHT_KEYS = new Set([
  'maxGross',
  'tare',
  'payload',
  'netWeight',
  'packagingWeight',
  'grossWeight',
  'vgm',
]);
const TIME_KEYS = new Set([
  'plannedPackingTime',
  'actualPackingTime',
  'truckArrivalTime',
]);
const CENTERED_KEYS = new Set([
  'sequenceNumber',
  'containerType',
  'packingDate',
  'isVgmDeclared',
  ...TIME_KEYS,
]);

/** @param {number} index 1-based column number @returns {string} */
export function columnLetter(index) {
  let letter = '';
  for (let rest = index; rest > 0; rest = Math.floor((rest - 1) / 26)) {
    letter = String.fromCharCode(65 + ((rest - 1) % 26)) + letter;
  }
  return letter;
}

/**
 * Index (0-based) of the header row in a sheet read as rows of cells —
 * the first row with a "Số container" cell (or its API alias); 0 when none
 * (a hand-made sheet without title rows still parses from its first row).
 * @param {unknown[][]} rows
 */
export function findContainerHeaderRow(rows) {
  const number = BULK_CONTAINER_COLUMNS.find(
    (column) => column.key === 'containerNumber',
  );
  const names = new Set(
    [number?.header, ...(number?.aliases ?? [])].map((name) =>
      String(name).toLocaleLowerCase('vi'),
    ),
  );
  const index = rows.findIndex((cells) =>
    cells.some((cell) =>
      names.has(String(cell ?? '').trim().toLocaleLowerCase('vi')),
    ),
  );
  return Math.max(index, 0);
}

/** @param {string} argb @returns {import('exceljs').Fill} */
const solidFill = (argb) => ({
  type: 'pattern',
  pattern: 'solid',
  fgColor: { argb },
});

/** @type {Partial<import('exceljs').Borders>} */
const thinBorder = {
  top: { style: 'thin', color: { argb: COLORS.border } },
  left: { style: 'thin', color: { argb: COLORS.border } },
  bottom: { style: 'thin', color: { argb: COLORS.border } },
  right: { style: 'thin', color: { argb: COLORS.border } },
};

/** @param {Partial<import('exceljs').Font>} [extra] */
const font = (extra = {}) => ({
  name: FONT,
  size: FONT_SIZE,
  color: { argb: COLORS.ink },
  ...extra,
});

/** @param {Date} date */
const displayDay = (date) =>
  `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}/${date.getFullYear()}`;

/**
 * Adds the "Containers" sheet frame shared by the template and the export:
 * page setup, columns, title, description, group band and header row.
 * @param {import('exceljs').Workbook} workbook
 * @param {{ key: string, header: string, hint?: string }[]} columns
 * @param {{ title: string, description: string, footer: string }} text
 */
function addContainerSheet(workbook, columns, text) {
  const lastColumn = columnLetter(columns.length);
  const sheet = workbook.addWorksheet('Containers', {
    properties: { defaultRowHeight: 20 },
    views: [{ state: 'frozen', ySplit: HEADER_ROW, xSplit: 0 }],
    pageSetup: {
      paperSize: 9, // A4
      orientation: 'landscape',
      fitToPage: true,
      fitToWidth: 1,
      fitToHeight: 0,
      horizontalCentered: true,
      printTitlesRow: `${HEADER_ROW}:${HEADER_ROW}`,
      margins: {
        left: 0.4,
        right: 0.4,
        top: 0.5,
        bottom: 0.6,
        header: 0.3,
        footer: 0.3,
      },
    },
    headerFooter: {
      // Text after a font-size code must not start with a digit: "&9" +
      // "26KCT27…" reads as font size 926.
      oddFooter: `&L&9${text.footer}&R&9Trang &P/&N`,
    },
  });
  sheet.columns = columns.map((column) => ({ width: WIDTHS[column.key] ?? 12 }));

  sheet.mergeCells(`A1:${lastColumn}1`);
  const title = sheet.getCell('A1');
  title.value = text.title;
  title.font = font({ size: 18, bold: true, color: { argb: COLORS.accent } });
  title.alignment = { vertical: 'middle', horizontal: 'left' };
  sheet.getRow(1).height = 32;

  sheet.mergeCells(`A2:${lastColumn}2`);
  const description = sheet.getCell('A2');
  description.value = text.description;
  description.font = font({ italic: true });
  description.alignment = { vertical: 'middle', horizontal: 'left' };
  sheet.getRow(2).height = 20;

  // Group band (row 4) over the header: tinted across the whole table,
  // labelled over each group.
  const bandRow = HEADER_ROW - 1;
  sheet.getRow(bandRow).height = 20;
  columns.forEach((_, index) => {
    const cell = sheet.getRow(bandRow).getCell(index + 1);
    cell.fill = solidFill(COLORS.band);
    cell.border = thinBorder;
  });
  const indexOf = (/** @type {string} */ key) =>
    columns.findIndex((column) => column.key === key) + 1;
  for (const [label, first, last] of GROUPS) {
    if (indexOf(first) === 0 || indexOf(last) === 0) continue;
    const from = columnLetter(indexOf(first));
    const to = columnLetter(indexOf(last));
    if (from !== to) sheet.mergeCells(`${from}${bandRow}:${to}${bandRow}`);
    const cell = sheet.getCell(`${from}${bandRow}`);
    cell.value = label.toLocaleUpperCase('vi');
    cell.font = font({ bold: true, size: 10, color: { argb: COLORS.accent } });
    cell.fill = solidFill(COLORS.band);
    cell.alignment = { vertical: 'middle', horizontal: 'center' };
    cell.border = thinBorder;
  }

  const header = sheet.getRow(HEADER_ROW);
  header.values = columns.map((column) => column.header);
  header.height = 46; // three wrapped lines ("Giờ xe vào nhà máy")
  header.eachCell((cell, index) => {
    const column = columns[index - 1];
    cell.font = font({ bold: true, color: { argb: COLORS.onAccent } });
    cell.fill = solidFill(COLORS.accent);
    cell.border = thinBorder;
    cell.alignment = {
      vertical: 'middle',
      horizontal: 'center',
      wrapText: true,
    };
    if (column.hint) {
      cell.note = REQUIRED_KEYS.has(column.key)
        ? `BẮT BUỘC — ${column.hint}`
        : column.hint;
    }
  });
  return sheet;
}

/**
 * Formats one data cell of a container row (template or export).
 * @param {import('exceljs').Cell} cell
 * @param {string} key
 */
function styleDataCell(cell, key) {
  cell.font = font();
  cell.border = thinBorder;
  cell.alignment = {
    vertical: 'middle',
    horizontal: WEIGHT_KEYS.has(key)
      ? 'right'
      : CENTERED_KEYS.has(key)
        ? 'center'
        : 'left',
    wrapText: key === 'note',
  };
  if (key === 'packingDate') cell.numFmt = DATE_FORMAT;
  if (WEIGHT_KEYS.has(key)) cell.numFmt = WEIGHT_FORMAT;
  // Times are typed as "08:00" text; keep them text so Excel does not
  // turn them into fractions of a day.
  if (TIME_KEYS.has(key)) cell.numFmt = '@';
}

/**
 * The import template ("mau-danh-sach-container.xlsx").
 * @param {typeof import('exceljs')} ExcelJS
 * @param {{
 *   shipmentCode: string,
 *   typeLabels: string[],
 *   carriers: string[],
 *   depots: { name: string, fullName: string | null }[],
 *   createdAt: Date,
 * }} input
 */
export function buildContainerTemplateWorkbook(ExcelJS, input) {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'KT-XNK';
  workbook.created = input.createdAt;
  const columns = BULK_CONTAINER_COLUMNS.map((column) => ({
    key: column.key,
    header: column.header,
    hint: column.hint,
  }));
  const sheet = addContainerSheet(workbook, columns, {
    title: `MẪU NHẬP DANH SÁCH CONTAINER - ${input.shipmentCode}`,
    description:
      'Điền từ dòng 6, mỗi dòng một container (tối đa 100). Bắt buộc: Số container, Loại cont. Loại cont, Nhà vận chuyển, Depot lấy rỗng chọn trong ô thả xuống. Rê chuột lên tiêu đề cột để xem cách nhập; chi tiết ở sheet "Hướng dẫn".',
    footer: `Mẫu nhập container — ${input.shipmentCode}`,
  });

  // "Danh mục": the lists behind the drop-downs, readable for reference.
  const lists = workbook.addWorksheet('Danh mục', {
    views: [{ state: 'frozen', ySplit: 1 }],
    pageSetup: { ...SIDE_SHEET_PAGE, orientation: 'landscape' },
  });
  lists.columns = [
    { width: 12 },
    { width: 48 },
    { width: 30 },
    { width: 64 },
  ];
  const listHeader = lists.getRow(1);
  listHeader.values = [
    'Loại cont',
    'Nhà vận chuyển',
    'Depot lấy rỗng',
    'Địa chỉ depot',
  ];
  listHeader.height = 24;
  listHeader.eachCell((cell) => {
    cell.font = font({ bold: true, color: { argb: COLORS.onAccent } });
    cell.fill = solidFill(COLORS.accent);
    cell.border = thinBorder;
    cell.alignment = { vertical: 'middle', horizontal: 'center' };
  });
  const listLength = Math.max(
    input.typeLabels.length,
    input.carriers.length,
    input.depots.length,
  );
  for (let index = 0; index < listLength; index += 1) {
    const row = lists.getRow(index + 2);
    row.values = [
      input.typeLabels[index] ?? null,
      input.carriers[index] ?? null,
      input.depots[index]?.name ?? null,
      input.depots[index]?.fullName ?? null,
    ];
    row.eachCell({ includeEmpty: true }, (cell) => {
      cell.font = font();
      cell.border = thinBorder;
    });
  }
  /** @param {string} column @param {number} count */
  const listRange = (column, count) =>
    `'Danh mục'!$${column}$2:$${column}$${Math.max(count, 1) + 1}`;

  /** @type {Record<string, import('exceljs').DataValidation>} */
  const validations = {
    containerType: {
      type: 'list',
      allowBlank: true,
      formulae: [listRange('A', input.typeLabels.length)],
      showErrorMessage: true,
      errorStyle: 'stop',
      errorTitle: 'Loại cont',
      error: "Chọn 20' / 40' / 40'HC / 45' trong danh sách.",
    },
    carrierName: {
      type: 'list',
      allowBlank: true,
      formulae: [listRange('B', input.carriers.length)],
      showErrorMessage: true,
      errorStyle: 'warning',
      errorTitle: 'Nhà vận chuyển',
      error: 'Tên không có trong danh mục Nhà cung cấp.',
    },
    depotName: {
      type: 'list',
      allowBlank: true,
      formulae: [listRange('C', input.depots.length)],
      showErrorMessage: true,
      errorStyle: 'warning',
      errorTitle: 'Depot lấy rỗng',
      error: 'Depot không có trong danh mục Cảng.',
    },
  };

  for (let index = 1; index <= TEMPLATE_ROW_COUNT; index += 1) {
    const row = sheet.getRow(HEADER_ROW + index);
    row.height = 20;
    columns.forEach((column, columnIndex) => {
      const cell = row.getCell(columnIndex + 1);
      styleDataCell(cell, column.key);
      if (REQUIRED_KEYS.has(column.key)) cell.fill = solidFill(COLORS.band);
      const validation = validations[column.key];
      if (validation) cell.dataValidation = validation;
    });
  }

  // "Hướng dẫn": one row per column.
  const guide = workbook.addWorksheet('Hướng dẫn', {
    pageSetup: SIDE_SHEET_PAGE,
  });
  guide.columns = [{ width: 26 }, { width: 12 }, { width: 96 }];
  guide.mergeCells('A1:C1');
  const guideTitle = guide.getCell('A1');
  guideTitle.value = 'HƯỚNG DẪN NHẬP DANH SÁCH CONTAINER';
  guideTitle.font = font({
    size: 16,
    bold: true,
    color: { argb: COLORS.accent },
  });
  guide.getRow(1).height = 28;
  const guideHeader = guide.getRow(3);
  guideHeader.values = ['Cột', 'Bắt buộc', 'Cách nhập'];
  guideHeader.eachCell((cell) => {
    cell.font = font({ bold: true, color: { argb: COLORS.onAccent } });
    cell.fill = solidFill(COLORS.accent);
    cell.border = thinBorder;
    cell.alignment = { vertical: 'middle', horizontal: 'center' };
  });
  guideHeader.height = 24;
  columns.forEach((column, index) => {
    const row = guide.getRow(4 + index);
    row.values = [
      column.header,
      REQUIRED_KEYS.has(column.key) ? 'Có' : '',
      column.hint ?? '',
    ];
    row.eachCell({ includeEmpty: true }, (cell, columnIndex) => {
      cell.font = font({ bold: columnIndex === 1 });
      cell.border = thinBorder;
      cell.alignment = {
        vertical: 'middle',
        horizontal: columnIndex === 2 ? 'center' : 'left',
        wrapText: true,
      };
    });
  });
  const notesTop = 4 + columns.length + 1;
  [
    `Loại cont hợp lệ: ${input.typeLabels.join(' · ')}.`,
    'Nhà vận chuyển và Depot lấy rỗng phải đúng tên trong danh mục (sheet "Danh mục"); depot mới thêm ở trang Danh mục › Cảng, loại "Depot cont rỗng".',
    'Khai VGM (Net weight + Khối lượng bao bì) cần đủ Max gross, Tare, Payload của container.',
    'Mỗi lần nhập tối đa 100 container; dòng trống bị bỏ qua. Có thể nhập lại tệp "Xuất Excel" (các cột STT, G.W, VGM, Đã khai VGM được bỏ qua).',
  ].forEach((note, index) => {
    const row = notesTop + index;
    guide.mergeCells(`A${row}:C${row}`);
    const cell = guide.getCell(`A${row}`);
    cell.value = `• ${note}`;
    cell.font = font();
    cell.alignment = { vertical: 'middle', wrapText: true };
    guide.getRow(row).height = 30;
  });

  return workbook;
}

/**
 * The "Xuất Excel" export of a shipment's containers.
 * @param {typeof import('exceljs')} ExcelJS
 * @param {{
 *   shipmentCode: string,
 *   typeMix: string,
 *   rows: ContainerExportRow[],
 *   exportedAt: Date,
 * }} input
 */
export function buildContainerExportWorkbook(ExcelJS, input) {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'KT-XNK';
  workbook.created = input.exportedAt;
  const columns = [
    ...EXPORT_LEAD,
    ...BULK_CONTAINER_COLUMNS.map((column) => ({
      key: column.key,
      header: column.header,
      hint: column.hint,
    })),
    ...EXPORT_TAIL,
  ];
  const count = input.rows.length;
  const sheet = addContainerSheet(workbook, columns, {
    title: `DANH SÁCH CONTAINER & VGM - ${input.shipmentCode}`,
    description: [
      `Lô hàng ${input.shipmentCode}`,
      `${count} container${input.typeMix ? ` (${input.typeMix})` : ''}`,
      `Xuất ngày ${displayDay(input.exportedAt)}`,
    ].join('  ·  '),
    footer: `Danh sách container — ${input.shipmentCode}`,
  });

  input.rows.forEach((item, index) => {
    const row = sheet.getRow(HEADER_ROW + 1 + index);
    row.height = 20;
    /** @type {Record<string, unknown>} */
    const values = {
      sequenceNumber: item.sequenceNumber,
      containerNumber: item.containerNumber,
      containerType: item.typeLabel,
      sealNumber: item.sealNumber,
      carrierName: item.carrier,
      depotName: item.depot,
      packingDate: item.packingDate
        ? new Date(`${item.packingDate}T00:00:00Z`)
        : null,
      plannedPackingTime: item.plannedPackingTime,
      actualPackingTime: item.actualPackingTime,
      truckArrivalTime: item.truckArrivalTime,
      maxGross: item.maxGross,
      tare: item.tare,
      payload: item.payload,
      netWeight: item.netWeight,
      packagingWeight: item.packagingWeight,
      note: item.note,
      grossWeight: item.grossWeight,
      vgm: item.vgm,
      isVgmDeclared: item.isVgmDeclared ? 'Có' : 'Chưa',
    };
    columns.forEach((column, columnIndex) => {
      const cell = row.getCell(columnIndex + 1);
      const value = values[column.key];
      cell.value = /** @type {import('exceljs').CellValue} */ (
        value === '' || value === undefined ? null : value
      );
      styleDataCell(cell, column.key);
      if (column.key === 'containerNumber') cell.font = font({ bold: true });
      if (column.key === 'isVgmDeclared') {
        cell.font = item.isVgmDeclared
          ? font({ bold: true, color: { argb: COLORS.accent } })
          : font({ color: { argb: COLORS.pending } });
      }
    });
  });

  // Total: G.W and VGM only (as the on-screen table). The label sits in
  // STT…Số seal, which the import ignores, so the file still imports back.
  const totalRow = HEADER_ROW + 1 + count;
  const firstData = HEADER_ROW + 1;
  const indexOf = (/** @type {string} */ key) =>
    columns.findIndex((column) => column.key === key) + 1;
  sheet.mergeCells(`A${totalRow}:${columnLetter(indexOf('containerType'))}${totalRow}`);
  sheet.getRow(totalRow).height = 24;
  columns.forEach((column, columnIndex) => {
    const cell = sheet.getRow(totalRow).getCell(columnIndex + 1);
    cell.fill = solidFill(COLORS.total);
    cell.border = {
      ...thinBorder,
      top: { style: 'medium', color: { argb: COLORS.accent } },
      bottom: { style: 'double', color: { argb: COLORS.accent } },
    };
    cell.font = font({ bold: true, color: { argb: COLORS.accent } });
  });
  const label = sheet.getCell(`A${totalRow}`);
  label.value = `TỔNG CỘNG · ${count} CONT`;
  label.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };
  for (const key of ['grossWeight', 'vgm']) {
    const letter = columnLetter(indexOf(key));
    const cell = sheet.getCell(`${letter}${totalRow}`);
    const result = input.rows.reduce(
      (sum, item) => sum + (item[/** @type {'vgm'} */ (key)] ?? 0),
      0,
    );
    cell.value =
      count > 0
        ? {
            formula: `SUM(${letter}${firstData}:${letter}${totalRow - 1})`,
            result,
          }
        : 0;
    cell.numFmt = WEIGHT_FORMAT;
    cell.alignment = { vertical: 'middle', horizontal: 'right' };
  }

  if (count > 0) {
    sheet.autoFilter = {
      from: { row: HEADER_ROW, column: 1 },
      to: { row: HEADER_ROW + count, column: columns.length },
    };
  }
  return workbook;
}
