/**
 * The "Xuất Excel" file of Kế toán › Danh sách hợp đồng: one fixed, grouped
 * layout whatever columns are visible on screen — Thông tin (STT … Nguồn),
 * Giá trị, Thanh toán & hoá đơn, Tiến độ — so the file reads as a report:
 * title block, four headline figures, a group band over the cobalt header,
 * zebra rows, overdue days in red, "% đã thanh toán" as a formula, and a
 * totals row of SUBTOTAL formulas (they follow the autofilter). Styled like
 * the other reports (Inter, black thin borders, landscape fit to one page
 * wide). Takes the ExcelJS module as an argument so the caller can
 * lazy-load it and tests can pass the Node build.
 */

const COLORS = {
  accent: 'FF0064E0',
  onAccent: 'FFFFFFFF',
  ink: 'FF000000',
  muted: 'FF5F6368',
  zebra: 'FFF6F8FB',
  summary: 'FFF3F5F8',
  success: 'FF0B7A4B',
  danger: 'FFC4281C',
  groups: ['FF1B3A6B', 'FF0B6E5B', 'FF8A4B08', 'FF5B3E96'],
};
const FONT = 'Inter';
const FONT_SIZE = 11;
const MONEY = '#,##0;-#,##0;"–"';
const DATE = 'dd/mm/yyyy';
const PERCENT = '0%';
const HEADER_ROW = 8;
const GROUP_ROW = 7;
const FIRST_DATA_ROW = HEADER_ROW + 1;

/**
 * @typedef {{
 *   key: string, header: string, group: number, width: number,
 *   kind: 'index' | 'text' | 'wrap' | 'date' | 'money' | 'rate' | 'int' | 'progress',
 *   value?: (row: import('../types/index.js').AccountingContractSummary, index: number) => unknown,
 * }} Column
 */

/** @type {string[]} */
const GROUPS = [
  'THÔNG TIN HỢP ĐỒNG',
  'GIÁ TRỊ (VND)',
  'THANH TOÁN & HOÁ ĐƠN (VND)',
  'TIẾN ĐỘ',
];

/** @type {Column[]} */
export const CONTRACT_EXPORT_COLUMNS = [
  { key: 'index', header: 'STT', group: 0, width: 7, kind: 'index' },
  { key: 'signedDate', header: 'Ngày ký', group: 0, width: 14, kind: 'date' },
  {
    key: 'contractNumber',
    header: 'Số hợp đồng',
    group: 0,
    width: 22,
    kind: 'text',
  },
  {
    key: 'projectCode',
    header: 'Mã công trình',
    group: 0,
    width: 18,
    kind: 'text',
  },
  {
    key: 'customerName',
    header: 'Khách hàng',
    group: 0,
    width: 36,
    kind: 'wrap',
  },
  { key: 'projectName', header: 'Dự án', group: 0, width: 36, kind: 'wrap' },
  { key: 'sourceName', header: 'Nguồn', group: 0, width: 20, kind: 'text' },
  {
    key: 'valueBeforeTax',
    header: 'Trước thuế',
    group: 1,
    width: 20,
    kind: 'money',
  },
  {
    key: 'taxRatePercent',
    header: 'Thuế (%)',
    group: 1,
    width: 10,
    kind: 'rate',
  },
  {
    key: 'valueAfterTax',
    header: 'Sau thuế',
    group: 1,
    width: 20,
    kind: 'money',
  },
  {
    key: 'settlementValue',
    header: 'Quyết toán',
    group: 1,
    width: 20,
    kind: 'money',
  },
  {
    key: 'paidValue',
    header: 'Đã thanh toán',
    group: 2,
    width: 20,
    kind: 'money',
  },
  {
    key: 'unpaidValue',
    header: 'Chưa thanh toán',
    group: 2,
    width: 20,
    kind: 'money',
  },
  {
    key: 'invoicedValue',
    header: 'Đã xuất HĐ',
    group: 2,
    width: 20,
    kind: 'money',
  },
  {
    key: 'remainingToInvoice',
    header: 'Còn phải xuất HĐ',
    group: 2,
    width: 20,
    kind: 'money',
  },
  {
    key: 'paidPercent',
    header: '% đã thanh toán',
    group: 3,
    width: 14,
    kind: 'progress',
  },
  {
    key: 'paymentDueDate',
    header: 'Tới hạn',
    group: 3,
    width: 14,
    kind: 'date',
  },
  {
    key: 'overdueDays',
    header: 'Quá hạn (ngày)',
    group: 3,
    width: 14,
    kind: 'int',
  },
  { key: 'note', header: 'Ghi chú', group: 3, width: 34, kind: 'wrap' },
];

/** @param {number} index 1-based */
function columnLetter(index) {
  let letter = '';
  for (let rest = index; rest > 0; rest = Math.floor((rest - 1) / 26)) {
    letter = String.fromCharCode(65 + ((rest - 1) % 26)) + letter;
  }
  return letter;
}

const black = /** @type {import('exceljs').Border} */ ({
  style: 'thin',
  color: { argb: COLORS.ink },
});
/** @type {Partial<import('exceljs').Borders>} */
const BORDER = { top: black, left: black, bottom: black, right: black };

/** @param {Partial<import('exceljs').Font>} [extra] */
const font = (extra = {}) => ({
  name: FONT,
  size: FONT_SIZE,
  color: { argb: COLORS.ink },
  ...extra,
});

/** @param {string} argb @returns {import('exceljs').Fill} */
const fill = (argb) => ({
  type: 'pattern',
  pattern: 'solid',
  fgColor: { argb },
});

/** @param {Date} date */
const displayDay = (date) =>
  `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}/${date.getFullYear()}`;

/** ISO date → Date at UTC midnight, so the day holds in any time zone. */
const toDate = (/** @type {string | null | undefined} */ iso) =>
  iso ? new Date(`${iso}T00:00:00Z`) : null;

/** @param {Date} day */
export function contractsWorkbookFileName(day) {
  return `Danh-sach-hop-dong-ke-toan-${day.toISOString().slice(0, 10)}.xlsx`;
}

/**
 * @param {typeof import('exceljs')} ExcelJS
 * @param {{
 *   rows: import('../types/index.js').AccountingContractSummary[],
 *   exportedAt: Date,
 *   scope: 'page' | 'all',
 *   filterCount?: number,
 * }} input
 */
export function buildContractsWorkbook(ExcelJS, input) {
  const { rows, exportedAt } = input;
  const columns = CONTRACT_EXPORT_COLUMNS;
  const lastColumn = columnLetter(columns.length);
  /** @type {Record<string, string>} */
  const letters = {};
  columns.forEach((column, index) => {
    letters[column.key] = columnLetter(index + 1);
  });
  const lastDataRow = FIRST_DATA_ROW + rows.length - 1;
  const totalsRow = lastDataRow + 1;

  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'KT-XNK';
  workbook.created = exportedAt;
  const totalWidth = columns.reduce((sum, column) => sum + column.width, 0);
  const sheet = workbook.addWorksheet('Hợp đồng', {
    properties: { defaultRowHeight: 20 },
    views: [
      {
        state: 'frozen',
        xSplit: 3,
        ySplit: HEADER_ROW,
        showGridLines: false,
      },
    ],
    pageSetup: {
      paperSize: /** @type {import('exceljs').PaperSize} */ (
        totalWidth > 180 ? 8 : 9 // 8 = A3, 9 = A4
      ),
      orientation: 'landscape',
      fitToPage: true,
      fitToWidth: 1,
      fitToHeight: 0,
      horizontalCentered: true,
      printTitlesRow: `${GROUP_ROW}:${HEADER_ROW}`,
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
      oddFooter: '&L&9Danh sách hợp đồng Kế toán&R&9Trang &P/&N',
    },
  });
  sheet.columns = columns.map((column) => ({ width: column.width }));

  // Title block.
  sheet.mergeCells(`A1:${lastColumn}1`);
  const title = sheet.getCell('A1');
  title.value = 'DANH SÁCH HỢP ĐỒNG KẾ TOÁN';
  title.font = font({ size: 18, bold: true, color: { argb: COLORS.accent } });
  title.alignment = { vertical: 'middle' };
  sheet.getRow(1).height = 32;

  sheet.mergeCells(`A2:${lastColumn}2`);
  const description = sheet.getCell('A2');
  description.value = [
    `${rows.length} hợp đồng`,
    input.scope === 'all' ? 'toàn bộ dữ liệu' : 'trang hiện tại',
    input.filterCount ? `đang lọc theo ${input.filterCount} điều kiện` : '',
    `Xuất ngày ${displayDay(exportedAt)}`,
  ]
    .filter(Boolean)
    .join('  ·  ');
  description.font = font({ italic: true, color: { argb: COLORS.muted } });

  // Headline figures: four blocks reading the totals row below.
  const headline = [
    ['TỔNG QUYẾT TOÁN', 'settlementValue', COLORS.ink],
    ['ĐÃ THANH TOÁN', 'paidValue', COLORS.success],
    ['CHƯA THANH TOÁN', 'unpaidValue', COLORS.danger],
    ['ĐÃ XUẤT HOÁ ĐƠN', 'invoicedValue', COLORS.accent],
  ];
  const blocks = [
    ['A', 'D'],
    ['E', 'G'],
    ['H', 'K'],
    ['L', 'O'],
  ];
  const sums = (/** @type {string} */ key) =>
    rows.reduce(
      (sum, row) =>
        sum +
        Number(
          /** @type {Record<string, unknown>} */ (/** @type {unknown} */ (row))[
            key
          ] ?? 0,
        ),
      0,
    );
  headline.forEach(([label, key, color], index) => {
    const [from, to] = blocks[index];
    sheet.mergeCells(`${from}4:${to}4`);
    sheet.mergeCells(`${from}5:${to}5`);
    const labelCell = sheet.getCell(`${from}4`);
    labelCell.value = label;
    labelCell.font = font({
      size: 9,
      bold: true,
      color: { argb: COLORS.muted },
    });
    labelCell.alignment = { vertical: 'middle', indent: 1 };
    const valueCell = sheet.getCell(`${from}5`);
    valueCell.value = {
      formula: `${letters[key]}${totalsRow}`,
      result: sums(key),
    };
    valueCell.numFmt = '#,##0" VND"';
    valueCell.font = font({ size: 14, bold: true, color: { argb: color } });
    valueCell.alignment = { vertical: 'middle', indent: 1 };
    for (const row of [4, 5]) {
      for (let c = from.charCodeAt(0); c <= to.charCodeAt(0); c += 1) {
        sheet.getCell(`${String.fromCharCode(c)}${row}`).fill = fill(
          COLORS.summary,
        );
      }
    }
  });
  sheet.getRow(4).height = 20;
  sheet.getRow(5).height = 28;

  // Group band over the header.
  let start = 0;
  while (start < columns.length) {
    let end = start;
    while (
      end + 1 < columns.length &&
      columns[end + 1].group === columns[start].group
    ) {
      end += 1;
    }
    sheet.mergeCells(
      `${columnLetter(start + 1)}${GROUP_ROW}:${columnLetter(end + 1)}${GROUP_ROW}`,
    );
    const cell = sheet.getCell(`${columnLetter(start + 1)}${GROUP_ROW}`);
    cell.value = GROUPS[columns[start].group];
    for (let c = start; c <= end; c += 1) {
      const groupCell = sheet.getCell(`${columnLetter(c + 1)}${GROUP_ROW}`);
      groupCell.fill = fill(COLORS.groups[columns[start].group]);
      groupCell.border = BORDER;
    }
    cell.font = font({
      bold: true,
      size: 10,
      color: { argb: COLORS.onAccent },
    });
    cell.alignment = { vertical: 'middle', horizontal: 'center' };
    start = end + 1;
  }
  sheet.getRow(GROUP_ROW).height = 22;

  const header = sheet.getRow(HEADER_ROW);
  header.values = columns.map((column) => column.header);
  header.height = 34;
  header.eachCell((cell) => {
    cell.font = font({ bold: true, color: { argb: COLORS.onAccent } });
    cell.fill = fill(COLORS.accent);
    cell.border = BORDER;
    cell.alignment = {
      vertical: 'middle',
      horizontal: 'center',
      wrapText: true,
    };
  });

  // Data rows.
  rows.forEach((contract, rowIndex) => {
    const rowNumber = FIRST_DATA_ROW + rowIndex;
    const row = sheet.getRow(rowNumber);
    const record = /** @type {Record<string, unknown>} */ (
      /** @type {unknown} */ (contract)
    );
    columns.forEach((column, columnIndex) => {
      const cell = row.getCell(columnIndex + 1);
      /** @type {unknown} */
      let value = record[column.key];
      if (column.kind === 'index') value = rowIndex + 1;
      if (column.kind === 'date')
        value = toDate(/** @type {string | null} */ (value));
      if (column.kind === 'progress') {
        const settlement = contract.settlementValue;
        value = {
          formula: `IF(${letters.settlementValue}${rowNumber}=0,0,${letters.paidValue}${rowNumber}/${letters.settlementValue}${rowNumber})`,
          result: settlement > 0 ? contract.paidValue / settlement : 0,
        };
      }
      if (value === '' || value === undefined) value = null;
      cell.value = /** @type {import('exceljs').CellValue} */ (value);
      cell.font = font();
      cell.border = BORDER;
      if (rowIndex % 2 === 1) cell.fill = fill(COLORS.zebra);
      const isNumber = ['money', 'rate', 'int', 'progress'].includes(
        column.kind,
      );
      cell.alignment = {
        vertical: 'middle',
        horizontal: isNumber
          ? 'right'
          : column.kind === 'date' || column.kind === 'index'
            ? 'center'
            : 'left',
        wrapText: column.kind === 'wrap',
      };
      if (column.kind === 'money') cell.numFmt = MONEY;
      if (column.kind === 'date') cell.numFmt = DATE;
      if (column.kind === 'rate') cell.numFmt = '0.##';
      if (column.kind === 'progress') cell.numFmt = PERCENT;
      if (column.kind === 'int') cell.numFmt = '#,##0;-#,##0;"–"';
    });
    const bold = row.getCell(letters.contractNumber);
    bold.font = font({ bold: true, color: { argb: COLORS.accent } });
    row.getCell(letters.settlementValue).font = font({ bold: true });
    row.getCell(letters.paidValue).font = font({
      color: { argb: COLORS.success },
    });
    row.getCell(letters.unpaidValue).font = font({
      color: { argb: COLORS.danger },
    });
    if ((contract.overdueDays ?? 0) > 0) {
      row.getCell(letters.overdueDays).font = font({
        bold: true,
        color: { argb: COLORS.danger },
      });
    }
    const progress =
      contract.settlementValue > 0
        ? contract.paidValue / contract.settlementValue
        : 0;
    row.getCell(letters.paidPercent).font = font({
      bold: true,
      color: {
        argb:
          progress >= 1
            ? COLORS.success
            : progress > 0
              ? COLORS.accent
              : COLORS.muted,
      },
    });
  });

  // Totals row: SUBTOTAL(109) follows the autofilter.
  const totals = sheet.getRow(totalsRow);
  totals.height = 26;
  columns.forEach((column, columnIndex) => {
    const cell = totals.getCell(columnIndex + 1);
    cell.fill = fill(COLORS.accent);
    cell.border = BORDER;
    cell.font = font({ bold: true, color: { argb: COLORS.onAccent } });
    cell.alignment = { vertical: 'middle', horizontal: 'right' };
    if (column.kind === 'money') {
      const letter = letters[column.key];
      cell.value = {
        formula: `SUBTOTAL(109,${letter}${FIRST_DATA_ROW}:${letter}${lastDataRow})`,
        result: sums(column.key),
      };
      cell.numFmt = MONEY;
    }
  });
  sheet.mergeCells(`A${totalsRow}:${letters.sourceName}${totalsRow}`);
  const totalsLabel = sheet.getCell(`A${totalsRow}`);
  totalsLabel.value = `TỔNG CỘNG (${rows.length} hợp đồng)`;
  totalsLabel.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };
  const paidTotal = sums('paidValue');
  const settlementTotal = sums('settlementValue');
  const progressCell = sheet.getCell(`${letters.paidPercent}${totalsRow}`);
  progressCell.value = {
    formula: `IF(${letters.settlementValue}${totalsRow}=0,0,${letters.paidValue}${totalsRow}/${letters.settlementValue}${totalsRow})`,
    result: settlementTotal > 0 ? paidTotal / settlementTotal : 0,
  };
  progressCell.numFmt = PERCENT;

  if (rows.length > 0) {
    sheet.autoFilter = {
      from: { row: HEADER_ROW, column: 1 },
      to: { row: lastDataRow, column: columns.length },
    };
  }
  return workbook;
}
