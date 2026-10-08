/**
 * "Xuất Excel" of a shipment's "Chi phí logistics" tab: one A4-landscape
 * sheet — title + shipment info block, a header row repeated on every
 * printed page, a tinted band per cost group with its SUM subtotal, the
 * group's lines, then a TỔNG CỘNG row and its breakdown. Amounts are real
 * numbers in VNĐ number format (subtotals / total are live formulas, with
 * cached results so previews show them too); dates are real dates.
 *
 * Takes the ExcelJS module as an argument so the caller can lazy-load it
 * and tests can pass the Node build.
 */

/**
 * @typedef {Object} CostWorkbookLine
 * @property {string} name
 * @property {number} quantity
 * @property {number} unitPrice
 * @property {number} amount
 * @property {boolean} isAbnormal
 * @property {string | null} provider
 * @property {boolean} paidOnBehalf
 * @property {string | null} payee
 * @property {string | null} invoiceNumber
 * @property {string | null} invoiceDate - ISO date
 * @property {string | null} note - Markdown from the rich text editor
 */
/**
 * @typedef {Object} CostWorkbookGroup
 * @property {string} label - "LOG-01 · ORIGIN …"
 * @property {CostWorkbookLine[]} lines
 */
/**
 * @typedef {Object} CostWorkbookInput
 * @property {string} shipmentCode
 * @property {string} shipmentName
 * @property {string} contractNumber
 * @property {string} incotermLabel
 * @property {string | null} bookingNumber
 * @property {string | null} vessel
 * @property {string | null} placeOfLoading
 * @property {string | null} placeOfDischarge
 * @property {string | null} etd - ISO date
 * @property {string | null} eta - ISO date
 * @property {string | null} atd - ISO date, actual departure
 * @property {string | null} ata - ISO date, actual arrival
 * @property {CostWorkbookGroup[]} groups - groups without lines are skipped
 * @property {Date} exportedAt
 */

// Excel ARGB colours mirroring the Meta theme (cobalt accent, group band,
// totals wash, hairline, ink / muted text, abnormal orange).
const EXCEL_COLORS = {
  accent: 'FF0064E0',
  onAccent: 'FFFFFFFF',
  groupBand: 'FFEBF3FE',
  totalBand: 'FFF0F5FF',
  infoLabel: 'FFF8F9FB',
  border: 'FFD0D5DD',
  ink: 'FF1C1E21',
  muted: 'FF65676B',
  abnormal: 'FFB94500',
};

const VND_FORMAT = '#,##0';
const DATE_FORMAT = 'dd/mm/yyyy';
const FONT = 'Arial';

/** `[header, width, horizontal alignment]`, columns A … K. */
const COLUMNS = /** @type {const} */ ([
  ['STT', 6, 'center'],
  ['Tên khoản chi phí', 34, 'left'],
  ['Số lượng', 9, 'right'],
  ['Đơn giá (VNĐ)', 15, 'right'],
  ['Thành tiền (VNĐ)', 17, 'right'],
  ['Loại phí', 11, 'center'],
  ['Nhà cung cấp', 26, 'left'],
  ['Chi hộ (đơn vị thu)', 20, 'left'],
  ['Số hoá đơn', 15, 'left'],
  ['Ngày HĐ', 11, 'center'],
  ['Ghi chú', 34, 'left'],
]);
const LAST_COLUMN = 'K';
const AMOUNT_COLUMN = 'E';

/**
 * Plain text for a cell from the editor's Markdown (bold / italics / code
 * marks, headings, list bullets and link targets dropped).
 * @param {string | null} markdown
 */
export function markdownToPlainText(markdown) {
  if (!markdown) return '';
  return markdown
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/^\s{0,3}#{1,6}\s+/gm, '')
    .replace(/^\s*[-*+]\s+/gm, '• ')
    .replace(/(\*\*|__|\*|_|~~|`)/g, '')
    .replace(/\\([\\`*_{}[\]()#+\-.!])/g, '$1')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

/** @param {string | null} iso  "2026-09-04" → a UTC-midnight Date. */
function isoDate(iso) {
  if (!iso) return null;
  const [year, month, day] = iso.slice(0, 10).split('-').map(Number);
  return year && month && day ? new Date(Date.UTC(year, month - 1, day)) : null;
}

/** @param {string | null} iso */
function displayDate(iso) {
  const date = isoDate(iso);
  if (!date) return '—';
  const pad = (/** @type {number} */ value) => String(value).padStart(2, '0');
  return `${pad(date.getUTCDate())}/${pad(date.getUTCMonth() + 1)}/${date.getUTCFullYear()}`;
}

/** @param {string} argb */
const solidFill = (argb) =>
  /** @type {import('exceljs').FillPattern} */ ({
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb },
  });

const thinBorder = /** @type {import('exceljs').Borders} */ ({
  top: { style: 'thin', color: { argb: EXCEL_COLORS.border } },
  left: { style: 'thin', color: { argb: EXCEL_COLORS.border } },
  bottom: { style: 'thin', color: { argb: EXCEL_COLORS.border } },
  right: { style: 'thin', color: { argb: EXCEL_COLORS.border } },
});

/**
 * @param {typeof import('exceljs')} ExcelJS
 * @param {CostWorkbookInput} input
 * @returns {import('exceljs').Workbook}
 */
export function buildShipmentCostWorkbook(ExcelJS, input) {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'KT-XNK';
  workbook.created = input.exportedAt;

  const sheet = workbook.addWorksheet('Chi phí logistics', {
    properties: { defaultRowHeight: 18 },
    pageSetup: {
      paperSize: 9, // A4
      orientation: 'landscape',
      fitToPage: true,
      fitToWidth: 1,
      fitToHeight: 0,
      horizontalCentered: true,
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
      // Text after a font-size code must not start with a digit: "&8" +
      // "26KCT27…" reads as font size 826.
      oddFooter: `&L&8Chi phí logistics — ${input.shipmentCode}&R&8Trang &P/&N`,
    },
  });
  sheet.columns = COLUMNS.map(([, width]) => ({ width }));

  const font = (/** @type {Partial<import('exceljs').Font>} */ extra = {}) => ({
    name: FONT,
    size: 10,
    color: { argb: EXCEL_COLORS.ink },
    ...extra,
  });

  // Title block.
  sheet.mergeCells(`A1:${LAST_COLUMN}1`);
  const title = sheet.getCell('A1');
  title.value = `BẢNG CHI PHÍ LOGISTICS — ${input.shipmentCode}`;
  title.font = font({
    size: 16,
    bold: true,
    color: { argb: EXCEL_COLORS.accent },
  });
  title.alignment = { vertical: 'middle', horizontal: 'left' };
  sheet.getRow(1).height = 28;

  sheet.mergeCells(`A2:${LAST_COLUMN}2`);
  const subtitle = sheet.getCell('A2');
  // The shipment's own name, when it says more than its code.
  subtitle.value =
    input.shipmentName && input.shipmentName !== input.shipmentCode
      ? input.shipmentName
      : '';
  subtitle.font = font({
    size: 11,
    italic: true,
    color: { argb: EXCEL_COLORS.muted },
  });

  // Info block: two label/value pairs per row (A-B | C-E, F-G | H-K).
  const route = [input.placeOfLoading, input.placeOfDischarge]
    .filter(Boolean)
    .join(' → ');
  const info = [
    ['Hợp đồng', input.contractNumber, 'Booking', input.bookingNumber],
    ['Điều kiện giao hàng', input.incotermLabel, 'Tàu / chuyến', input.vessel],
    [
      'Tuyến',
      route,
      'ETD / ETA',
      `${displayDate(input.etd)}  →  ${displayDate(input.eta)}`,
    ],
    [
      'Ngày xuất báo cáo',
      // Local calendar day (toISOString would be UTC: the previous day
      // for an evening export in Vietnam).
      displayDate(
        [
          input.exportedAt.getFullYear(),
          String(input.exportedAt.getMonth() + 1).padStart(2, '0'),
          String(input.exportedAt.getDate()).padStart(2, '0'),
        ].join('-'),
      ),
      'ATD / ATA',
      `${displayDate(input.atd)}  →  ${displayDate(input.ata)}`,
    ],
  ];
  info.forEach(([leftLabel, leftValue, rightLabel, rightValue], index) => {
    const row = 4 + index;
    sheet.mergeCells(`A${row}:B${row}`);
    sheet.mergeCells(`C${row}:E${row}`);
    sheet.mergeCells(`F${row}:G${row}`);
    sheet.mergeCells(`H${row}:${LAST_COLUMN}${row}`);
    for (const [column, value, isLabel] of /** @type {const} */ ([
      ['A', leftLabel, true],
      ['C', leftValue, false],
      ['F', rightLabel, true],
      ['H', rightValue, false],
    ])) {
      const cell = sheet.getCell(`${column}${row}`);
      cell.value = value || '—';
      cell.font = isLabel
        ? font({ color: { argb: EXCEL_COLORS.muted } })
        : font({ bold: true });
      if (isLabel) cell.fill = solidFill(EXCEL_COLORS.infoLabel);
      cell.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };
    }
  });

  // Column headers, repeated on every printed page.
  const headerRowNumber = 9;
  const headerRow = sheet.getRow(headerRowNumber);
  headerRow.values = COLUMNS.map(([header]) => header);
  headerRow.height = 30;
  headerRow.eachCell((cell, column) => {
    cell.font = font({ bold: true, color: { argb: EXCEL_COLORS.onAccent } });
    cell.fill = solidFill(EXCEL_COLORS.accent);
    cell.border = thinBorder;
    cell.alignment = {
      vertical: 'middle',
      horizontal: COLUMNS[column - 1][2] === 'left' ? 'left' : 'center',
      wrapText: true,
    };
  });
  sheet.views = [{ state: 'frozen', ySplit: headerRowNumber }];
  sheet.pageSetup.printTitlesRow = `${headerRowNumber}:${headerRowNumber}`;

  // Groups and their lines.
  let rowNumber = headerRowNumber;
  let lineNumber = 0;
  /** Subtotal cells, summed by the TỔNG CỘNG row. */
  const subtotalCells = /** @type {string[]} */ ([]);
  let total = 0;
  let abnormalTotal = 0;
  let paidOnBehalfTotal = 0;
  const providers = new Set();
  const invoices = new Set();

  for (const group of input.groups) {
    if (group.lines.length === 0) continue;
    rowNumber += 1;
    const bandRow = rowNumber;
    const firstLine = bandRow + 1;
    const lastLine = bandRow + group.lines.length;
    const subtotal = group.lines.reduce((sum, line) => sum + line.amount, 0);

    sheet.mergeCells(`A${bandRow}:D${bandRow}`);
    const label = sheet.getCell(`A${bandRow}`);
    label.value = `${group.label}  (${group.lines.length} khoản)`;
    const subtotalCell = sheet.getCell(`${AMOUNT_COLUMN}${bandRow}`);
    subtotalCell.value = {
      formula: `SUM(${AMOUNT_COLUMN}${firstLine}:${AMOUNT_COLUMN}${lastLine})`,
      result: subtotal,
    };
    subtotalCell.numFmt = VND_FORMAT;
    subtotalCells.push(`${AMOUNT_COLUMN}${bandRow}`);
    sheet.getRow(bandRow).height = 22;
    for (let column = 1; column <= COLUMNS.length; column += 1) {
      const cell = sheet.getRow(bandRow).getCell(column);
      cell.fill = solidFill(EXCEL_COLORS.groupBand);
      cell.border = thinBorder;
      cell.font = font({ bold: true, color: { argb: EXCEL_COLORS.accent } });
      cell.alignment = {
        vertical: 'middle',
        horizontal: column === 5 ? 'right' : 'left',
        indent: column === 1 ? 1 : 0,
      };
    }

    for (const line of group.lines) {
      rowNumber += 1;
      lineNumber += 1;
      total += line.amount;
      if (line.isAbnormal) abnormalTotal += line.amount;
      if (line.paidOnBehalf) paidOnBehalfTotal += line.amount;
      if (line.provider) providers.add(line.provider);
      if (line.invoiceNumber) invoices.add(line.invoiceNumber);

      const row = sheet.getRow(rowNumber);
      row.values = [
        lineNumber,
        line.name,
        line.quantity,
        line.unitPrice,
        line.amount,
        line.isAbnormal ? 'Phát sinh' : 'Thường',
        line.provider ?? '',
        line.paidOnBehalf ? (line.payee ?? 'Chi hộ') : '',
        line.invoiceNumber ?? '',
        isoDate(line.invoiceDate),
        markdownToPlainText(line.note),
      ];
      row.eachCell({ includeEmpty: true }, (cell, column) => {
        cell.border = thinBorder;
        cell.font = font();
        cell.alignment = {
          vertical: 'top',
          horizontal: COLUMNS[column - 1][2],
          wrapText: [2, 7, 8, 11].includes(column),
        };
      });
      row.getCell(4).numFmt = VND_FORMAT;
      row.getCell(5).numFmt = VND_FORMAT;
      row.getCell(5).font = font({ bold: true });
      row.getCell(10).numFmt = DATE_FORMAT;
      if (line.isAbnormal) {
        row.getCell(6).font = font({
          bold: true,
          color: { argb: EXCEL_COLORS.abnormal },
        });
      }
    }
  }

  // TỔNG CỘNG + breakdown.
  rowNumber += 1;
  const totalRow = rowNumber;
  sheet.mergeCells(`A${totalRow}:D${totalRow}`);
  sheet.getCell(`A${totalRow}`).value = `TỔNG CỘNG (${lineNumber} khoản phí)`;
  const totalCell = sheet.getCell(`${AMOUNT_COLUMN}${totalRow}`);
  totalCell.value = subtotalCells.length
    ? { formula: subtotalCells.join('+'), result: total }
    : 0;
  totalCell.numFmt = VND_FORMAT;
  sheet.getRow(totalRow).height = 24;
  for (let column = 1; column <= COLUMNS.length; column += 1) {
    const cell = sheet.getRow(totalRow).getCell(column);
    cell.fill = solidFill(EXCEL_COLORS.totalBand);
    cell.font = font({ bold: true, size: 11 });
    cell.border = {
      ...thinBorder,
      top: { style: 'medium', color: { argb: EXCEL_COLORS.accent } },
      bottom: { style: 'double', color: { argb: EXCEL_COLORS.accent } },
    };
    cell.alignment = {
      vertical: 'middle',
      horizontal: column === 5 ? 'right' : 'left',
      indent: column === 1 ? 1 : 0,
    };
  }
  totalCell.font = font({
    bold: true,
    size: 11,
    color: { argb: EXCEL_COLORS.accent },
  });

  const breakdown = /** @type {[string, number | string][]} */ ([
    ['Trong đó: chi phí phát sinh (Abnormal)', abnormalTotal],
    ['Trong đó: NCC chi hộ', paidOnBehalfTotal],
    ['Số nhà cung cấp', providers.size],
    ['Số hoá đơn', invoices.size],
  ]);
  breakdown.forEach(([caption, value], index) => {
    const row = totalRow + 1 + index;
    sheet.mergeCells(`A${row}:D${row}`);
    const captionCell = sheet.getCell(`A${row}`);
    captionCell.value = caption;
    captionCell.font = font({
      italic: true,
      color: { argb: EXCEL_COLORS.muted },
    });
    captionCell.alignment = { horizontal: 'right', indent: 1 };
    const valueCell = sheet.getCell(`${AMOUNT_COLUMN}${row}`);
    valueCell.value = value;
    valueCell.numFmt = index < 2 ? VND_FORMAT : '0';
    valueCell.font = font({ color: { argb: EXCEL_COLORS.muted } });
    valueCell.alignment = { horizontal: 'right' };
  });

  return workbook;
}
