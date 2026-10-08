/**
 * The "Xuất Excel" file of an `AdvanceTable` list (contracts, shipments, …),
 * built with ExcelJS in the style of the container / cost reports: a title,
 * a description line (row count, filter, export day), a cobalt header row
 * frozen and repeated on printed pages with an autofilter, framed cells,
 * landscape fit to one page wide (A3 when the list is wide) with page
 * numbers. ISO dates become
 * real dates (dd/mm/yyyy); numbers keep a thousands separator (two
 * decimals only in a column that has fractions); widths follow the content.
 *
 * Takes the ExcelJS module as an argument so the caller can lazy-load it
 * and tests can pass the Node build.
 */

// Meta cobalt accent; text and borders black, as in the other reports.
const COLORS = {
  accent: 'FF0064E0',
  onAccent: 'FFFFFFFF',
  ink: 'FF000000',
  border: 'FF000000',
};
const FONT = 'Arial';
const FONT_SIZE = 11;
const HEADER_ROW = 4;
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/u;
/** Total column width (characters) still readable on A4 landscape. */
const A4_MAX_WIDTH = 180;

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

/** @param {number} index 1-based column number */
function columnLetter(index) {
  let letter = '';
  for (let rest = index; rest > 0; rest = Math.floor((rest - 1) / 26)) {
    letter = String.fromCharCode(65 + ((rest - 1) % 26)) + letter;
  }
  return letter;
}

/**
 * A cell value as written: ISO dates → Date (UTC midnight, so the day
 * holds in any time zone), blank → null, anything else as is.
 * @param {unknown} value
 * @returns {string | number | Date | boolean | null}
 */
export function listCellValue(value) {
  if (value === null || value === undefined || value === '') return null;
  if (typeof value === 'string' && ISO_DATE.test(value)) {
    return new Date(`${value}T00:00:00Z`);
  }
  if (typeof value === 'number' && !Number.isFinite(value)) return null;
  return /** @type {string | number | boolean} */ (value);
}

/**
 * @param {typeof import('exceljs')} ExcelJS
 * @param {{
 *   title: string,
 *   headerRow: string[],
 *   dataRows: unknown[][],
 *   exportedAt: Date,
 *   filterCount?: number,
 *   footer?: string,
 * }} input
 */
export function buildListWorkbook(ExcelJS, input) {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'KT-XNK';
  workbook.created = input.exportedAt;
  const columnCount = Math.max(input.headerRow.length, 1);
  const lastColumn = columnLetter(columnCount);
  const rows = input.dataRows.map((row) => row.map(listCellValue));

  // Per column: number format and a width from the longest text.
  const columns = input.headerRow.map((header, index) => {
    const values = rows.map((row) => row[index]);
    const numbers = values.filter((value) => typeof value === 'number');
    const isDate = values.some((value) => value instanceof Date);
    const hasFraction = numbers.some((value) => !Number.isInteger(value));
    const textLength = Math.max(
      ...values.map((value) =>
        value instanceof Date
          ? 10
          : typeof value === 'number'
            ? value.toLocaleString('en-US').length + (hasFraction ? 3 : 0)
            : String(value ?? '').length,
      ),
      0,
    );
    // Header words wrap; a long word sets the floor.
    const headerFloor = Math.max(
      ...header.split(/\s+/u).map((word) => word.length),
    );
    return {
      numFmt: isDate
        ? 'dd/mm/yyyy'
        : numbers.length > 0
          ? hasFraction
            ? '#,##0.00'
            : '#,##0'
          : undefined,
      isNumeric: numbers.length > 0 && !isDate,
      isDate,
      // Arial runs ~15% wider than Excel's character unit.
      width: Math.min(
        Math.ceil(Math.max(textLength, headerFloor, 6) * 1.15) + 2,
        48,
      ),
    };
  });

  const footer = input.footer ?? input.title;
  // A wide list (many columns) prints on A3 so its text stays readable
  // once fitted to one page wide.
  const totalWidth = columns.reduce((sum, column) => sum + column.width, 0);
  const paperSize = /** @type {import('exceljs').PaperSize} */ (
    totalWidth > A4_MAX_WIDTH ? 8 : 9 // 8 = A3, 9 = A4
  );
  const sheet = workbook.addWorksheet('Danh sách', {
    properties: { defaultRowHeight: 20 },
    views: [{ state: 'frozen', ySplit: HEADER_ROW, xSplit: 0 }],
    pageSetup: {
      paperSize,
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
      // "26KCT…" reads as font size 926.
      oddFooter: `&L&9${footer}&R&9Trang &P/&N`,
    },
  });
  sheet.columns = columns.map((column) => ({ width: column.width }));

  sheet.mergeCells(`A1:${lastColumn}1`);
  const title = sheet.getCell('A1');
  title.value = input.title;
  title.font = font({ size: 18, bold: true, color: { argb: COLORS.accent } });
  title.alignment = { vertical: 'middle', horizontal: 'left' };
  sheet.getRow(1).height = 32;

  sheet.mergeCells(`A2:${lastColumn}2`);
  const description = sheet.getCell('A2');
  description.value = [
    `${rows.length} dòng`,
    input.filterCount ? `đang lọc theo ${input.filterCount} điều kiện` : '',
    `Xuất ngày ${displayDay(input.exportedAt)}`,
  ]
    .filter(Boolean)
    .join('  ·  ');
  description.font = font({ italic: true });
  description.alignment = { vertical: 'middle', horizontal: 'left' };

  const header = sheet.getRow(HEADER_ROW);
  header.values = input.headerRow;
  header.height = 34;
  header.eachCell((cell) => {
    cell.font = font({ bold: true, color: { argb: COLORS.onAccent } });
    cell.fill = solidFill(COLORS.accent);
    cell.border = thinBorder;
    cell.alignment = {
      vertical: 'middle',
      horizontal: 'center',
      wrapText: true,
    };
  });

  rows.forEach((values, rowIndex) => {
    const row = sheet.getRow(HEADER_ROW + 1 + rowIndex);
    columns.forEach((column, columnIndex) => {
      const cell = row.getCell(columnIndex + 1);
      cell.value = /** @type {import('exceljs').CellValue} */ (
        values[columnIndex] ?? null
      );
      cell.font = font();
      cell.border = thinBorder;
      if (column.numFmt) cell.numFmt = column.numFmt;
      cell.alignment = {
        vertical: 'middle',
        horizontal: column.isNumeric
          ? 'right'
          : column.isDate
            ? 'center'
            : 'left',
        wrapText: column.width >= 48,
      };
    });
  });

  if (rows.length > 0) {
    sheet.autoFilter = {
      from: { row: HEADER_ROW, column: 1 },
      to: { row: HEADER_ROW + rows.length, column: columnCount },
    };
  }
  return workbook;
}
