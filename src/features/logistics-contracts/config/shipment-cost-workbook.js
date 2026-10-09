/**
 * "Xuất Excel" of a shipment's "Chi phí logistics" tab: one A4-landscape
 * sheet — title + shipment info block, a header row repeated on every
 * printed page, a tinted band per cost group with its SUM subtotal, the
 * group's lines, then a TỔNG CỘNG row, its breakdown and the director's
 * signature block. Group names are Vietnamese. Amounts are real
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
 * @property {string} code - "LOG-01" … "LOG-08"; '' for uncategorized lines
 * @property {string} name - catalog name, used when the code has no
 *   Vietnamese name in {@link COST_GROUP_NAMES_VI}
 * @property {CostWorkbookLine[]} lines
 */
/**
 * @typedef {Object} CostWorkbookInput
 * @property {string} shipmentCode
 * @property {string} contractNumber
 * @property {string} incotermLabel
 * @property {{ amount: number, currency: string }} shipmentValue - the
 *   commercial invoice value ("Giá trị lô hàng")
 * @property {number | null} shipmentValueVnd - declared value in VNĐ
 * @property {number | null} exchangeRate - customs declaration rate
 * @property {string | null} placeOfLoading
 * @property {string | null} placeOfDischarge
 * @property {string | null} atd - ISO date, actual departure
 * @property {string | null} ata - ISO date, actual arrival
 * @property {CostWorkbookGroup[]} groups - groups without lines are skipped
 * @property {Date} exportedAt
 */

// Excel ARGB colours: Meta theme cobalt accent, group band and totals
// wash, abnormal orange; text and borders black — no grey (user,
// 2026-10-08).
const EXCEL_COLORS = {
  accent: 'FF0064E0',
  onAccent: 'FFFFFFFF',
  groupBand: 'FFEBF3FE',
  totalBand: 'FFF0F5FF',
  border: 'FF000000',
  ink: 'FF000000',
  abnormal: 'FFB94500',
};

/**
 * Vietnamese names of the fixed LOG groups (the BE catalog's names are
 * English), for the exported report (user request, 2026-10-08).
 */
export const COST_GROUP_NAMES_VI = /** @type {Record<string, string>} */ ({
  'LOG-01': 'Chuẩn bị hàng & đóng gói xuất khẩu',
  'LOG-02': 'Vận chuyển nội địa đầu xuất & depot',
  'LOG-03': 'Phí cảng & thủ tục xuất khẩu',
  'LOG-04': 'Cước vận chuyển quốc tế & bảo hiểm',
  'LOG-05': 'Phí cảng đích',
  'LOG-06': 'Vận chuyển nội địa đầu nhập',
  'LOG-07': 'Thủ tục hải quan nhập khẩu',
  'LOG-08': 'Thuế & phí nhập khẩu',
});

/** Signs the report (user request, 2026-10-08). */
export const COST_REPORT_SIGNER = {
  title: 'TỔNG GIÁM ĐỐC',
  name: 'Lê Văn Chí',
};

const VND_FORMAT = '#,##0';
const DATE_FORMAT = 'dd/mm/yyyy';
const FONT = 'Inter';
/** Body text size (user, 2026-10-08: larger than the first 10pt). */
const FONT_SIZE = 12;

/** `[header, width, horizontal alignment]`, columns A … K. */
const COLUMNS = /** @type {const} */ ([
  ['STT', 7, 'center'],
  ['Tên khoản chi phí', 40, 'left'],
  ['Số lượng', 10, 'right'],
  ['Đơn giá (VNĐ)', 18, 'right'],
  ['Thành tiền (VNĐ)', 20, 'right'],
  ['Loại phí', 13, 'center'],
  ['Nhà cung cấp', 30, 'left'],
  ['Chi hộ (đơn vị thu)', 24, 'left'],
  ['Số hoá đơn', 17, 'left'],
  ['Ngày HĐ', 14, 'center'],
  ['Ghi chú', 40, 'left'],
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
    properties: { defaultRowHeight: 20 },
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
      // Text after a font-size code must not start with a digit: "&9" +
      // "26KCT27…" reads as font size 926.
      oddFooter: `&L&9Bảng kê chi phí logistic — ${input.shipmentCode}&R&9Trang &P/&N`,
    },
  });
  sheet.columns = COLUMNS.map(([, width]) => ({ width }));

  const font = (/** @type {Partial<import('exceljs').Font>} */ extra = {}) => ({
    name: FONT,
    size: FONT_SIZE,
    color: { argb: EXCEL_COLORS.ink },
    ...extra,
  });

  // Title block.
  sheet.mergeCells(`A1:${LAST_COLUMN}1`);
  const title = sheet.getCell('A1');
  title.value = `BẢNG KÊ CHI PHÍ LOGISTIC - ${input.shipmentCode}`;
  title.font = font({
    size: 20,
    bold: true,
    color: { argb: EXCEL_COLORS.accent },
  });
  title.alignment = { vertical: 'middle', horizontal: 'left' };
  sheet.getRow(1).height = 34;

  // Info block: two label/value pairs per row (A-B | C-E, F-G | H-K).
  const route = [input.placeOfLoading, input.placeOfDischarge]
    .filter(Boolean)
    .join(' → ');
  const { amount: valueAmount, currency: valueCurrency } = input.shipmentValue;
  /** @typedef {string | { value: number, numFmt: string } | null} InfoValue */
  const info = /** @type {[string, InfoValue, string, InfoValue][]} */ ([
    [
      'Hợp đồng',
      input.contractNumber,
      'Điều kiện giao hàng',
      input.incotermLabel,
    ],
    [
      `Giá trị lô hàng (${valueCurrency})`,
      { value: valueAmount, numFmt: `#,##0.00" ${valueCurrency}"` },
      `Tỷ giá (VNĐ/${valueCurrency})`,
      input.exchangeRate === null
        ? null
        : {
            value: input.exchangeRate,
            // "#,##0.##" would print a whole rate as "25,890."
            numFmt: Number.isInteger(input.exchangeRate)
              ? VND_FORMAT
              : '#,##0.00',
          },
    ],
    [
      'Giá trị quy đổi (VNĐ)',
      input.shipmentValueVnd === null
        ? null
        : { value: input.shipmentValueVnd, numFmt: `${VND_FORMAT}" VNĐ"` },
      'Tuyến',
      route,
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
  ]);
  info.forEach(([leftLabel, leftValue, rightLabel, rightValue], index) => {
    const row = 3 + index;
    sheet.getRow(row).height = 22;
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
      if (value && typeof value === 'object') {
        cell.value = value.value;
        cell.numFmt = value.numFmt;
      } else {
        cell.value = value || '—';
      }
      cell.font = isLabel ? font() : font({ bold: true });
      cell.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };
    }
  });

  // Column headers, repeated on every printed page.
  const headerRowNumber = 8;
  const headerRow = sheet.getRow(headerRowNumber);
  headerRow.values = COLUMNS.map(([header]) => header);
  headerRow.height = 36;
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
    const groupName = COST_GROUP_NAMES_VI[group.code] ?? group.name;
    label.value = `${group.code ? `${group.code} · ` : ''}${groupName}  (${group.lines.length} khoản)`;
    const subtotalCell = sheet.getCell(`${AMOUNT_COLUMN}${bandRow}`);
    subtotalCell.value = {
      formula: `SUM(${AMOUNT_COLUMN}${firstLine}:${AMOUNT_COLUMN}${lastLine})`,
      result: subtotal,
    };
    subtotalCell.numFmt = VND_FORMAT;
    subtotalCells.push(`${AMOUNT_COLUMN}${bandRow}`);
    sheet.getRow(bandRow).height = 26;
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
  sheet.getRow(totalRow).height = 30;
  for (let column = 1; column <= COLUMNS.length; column += 1) {
    const cell = sheet.getRow(totalRow).getCell(column);
    cell.fill = solidFill(EXCEL_COLORS.totalBand);
    cell.font = font({ bold: true, size: 14 });
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
    size: 14,
    color: { argb: EXCEL_COLORS.accent },
  });

  /** @type {[string, import('exceljs').CellValue, string][]} */
  const breakdown = [
    ['Trong đó: chi phí phát sinh (Abnormal)', abnormalTotal, VND_FORMAT],
    ['Trong đó: NCC chi hộ', paidOnBehalfTotal, VND_FORMAT],
    ['Số nhà cung cấp', providers.size, '0'],
    ['Số hoá đơn', invoices.size, '0'],
  ];
  if (input.exchangeRate) {
    breakdown.push([
      `Tổng chi phí quy đổi (${input.shipmentValue.currency})`,
      {
        formula: `${AMOUNT_COLUMN}${totalRow}/${input.exchangeRate}`,
        result: total / input.exchangeRate,
      },
      `#,##0.00" ${input.shipmentValue.currency}"`,
    ]);
  }
  if (input.shipmentValueVnd) {
    breakdown.push([
      'Tỷ lệ chi phí / giá trị lô hàng (VNĐ)',
      {
        formula: `${AMOUNT_COLUMN}${totalRow}/${input.shipmentValueVnd}`,
        result: total / input.shipmentValueVnd,
      },
      '0.00%',
    ]);
  }
  breakdown.forEach(([caption, value, numFmt], index) => {
    const row = totalRow + 1 + index;
    sheet.mergeCells(`A${row}:D${row}`);
    const captionCell = sheet.getCell(`A${row}`);
    captionCell.value = caption;
    captionCell.font = font({
      italic: true,
    });
    captionCell.alignment = { horizontal: 'right', indent: 1 };
    const valueCell = sheet.getCell(`${AMOUNT_COLUMN}${row}`);
    valueCell.value = value;
    valueCell.numFmt = numFmt;
    valueCell.font = font();
    valueCell.alignment = { horizontal: 'right' };
  });

  // Signature block, right-aligned under the table (H … K): date line,
  // title, a gap to sign in, name.
  const signatureTop = totalRow + breakdown.length + 3;
  const exported = input.exportedAt;
  const signature =
    /** @type {[string, Partial<import('exceljs').Font>, number][]} */ ([
      [
        `Ngày ${String(exported.getDate()).padStart(2, '0')} tháng ${String(exported.getMonth() + 1).padStart(2, '0')} năm ${exported.getFullYear()}`,
        { italic: true },
        22,
      ],
      [COST_REPORT_SIGNER.title, { bold: true, size: 14 }, 22],
      ['(Ký, ghi rõ họ tên)', { italic: true, size: 11 }, 18],
      ['', {}, 72],
      [COST_REPORT_SIGNER.name, { bold: true, size: 14 }, 22],
    ]);
  signature.forEach(([text, fontExtra, height], index) => {
    const row = signatureTop + index;
    sheet.mergeCells(`H${row}:${LAST_COLUMN}${row}`);
    const cell = sheet.getCell(`H${row}`);
    cell.value = text;
    cell.font = font(fontExtra);
    cell.alignment = { horizontal: 'center', vertical: 'middle' };
    sheet.getRow(row).height = height;
  });
  return workbook;
}
