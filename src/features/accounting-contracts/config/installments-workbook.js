/**
 * The "Xuất Excel" file of a contract's "Đợt thanh toán" tab, laid out like
 * the tab: a title block with the contract, three summary figures, then each
 * stage as a tinted band (its totals) followed by its payments (lần)
 * indented underneath — collapsible with Excel's outline buttons — and a
 * grand total at the bottom. Styled like the other reports (Inter, cobalt
 * header, black thin borders). Takes the ExcelJS module as an argument so
 * the caller can lazy-load it and tests can pass the Node build.
 */

const COLORS = {
  accent: 'FF0064E0',
  onAccent: 'FFFFFFFF',
  ink: 'FF000000',
  muted: 'FF5F6368',
  band: 'FFE7F0FD',
  summary: 'FFF3F5F8',
  success: 'FF0B7A4B',
  danger: 'FFC4281C',
};
const FONT = 'Inter';
const FONT_SIZE = 11;
const MONEY = '#,##0;-#,##0;"–"';
const DATE = 'dd/mm/yyyy';
const COLUMN_COUNT = 10;
const HEADER_ROW = 8;

const HEADER = [
  'Đợt / Lần',
  'Hình thức',
  'Tỷ lệ (%)',
  'Sau thuế (VND)',
  'Thực tế thanh toán',
  'Chưa thanh toán',
  'Trạng thái',
  'Ngày thanh toán',
  'Điều kiện',
  'Ghi chú',
];
const WIDTHS = [16, 15, 11, 20, 20, 20, 19, 17, 36, 30];

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

/** ISO date → Date at UTC midnight, so the day holds in any time zone. */
const toDate = (/** @type {string | null} */ iso) =>
  iso ? new Date(`${iso}T00:00:00Z`) : null;

/** @param {Date} date */
const displayDay = (date) =>
  `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}/${date.getFullYear()}`;

/** What was actually received ("Giá trị thực tế thanh toán").
 * @param {import('../types/index.js').AccountingSubInstallment} sub */
const paidOf = (sub) => sub.actualPaidAmount ?? 0;

/** @param {import('../types/index.js').AccountingInstallment} stage */
function stageStatus(stage) {
  const subs = stage.subInstallments;
  if (subs.length > 0 && subs.every((sub) => sub.status === 'Paid')) {
    return { label: 'Đã thanh toán', color: COLORS.success };
  }
  if (subs.some((sub) => sub.status === 'Paid')) {
    return { label: 'Thanh toán một phần', color: COLORS.accent };
  }
  return { label: 'Kế hoạch', color: COLORS.muted };
}

/** @param {string} contractNumber @param {Date} day */
export function installmentWorkbookFileName(contractNumber, day) {
  return `Dot-thanh-toan-${contractNumber}-${day.toISOString().slice(0, 10)}.xlsx`;
}

/**
 * @param {typeof import('exceljs')} ExcelJS
 * @param {{
 *   contract: import('../types/index.js').AccountingContractSummary,
 *   installments: import('../types/index.js').AccountingInstallment[],
 *   exportedAt: Date,
 * }} input
 */
export function buildInstallmentWorkbook(ExcelJS, input) {
  const { contract, exportedAt } = input;
  const stages = input.installments.slice().sort((a, b) => a.number - b.number);

  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'KT-XNK';
  workbook.created = exportedAt;
  const sheet = workbook.addWorksheet('Đợt thanh toán', {
    properties: {
      defaultRowHeight: 20,
      outlineProperties: { summaryBelow: false, summaryRight: true },
    },
    views: [{ state: 'frozen', ySplit: HEADER_ROW, showGridLines: false }],
    pageSetup: {
      paperSize: 9,
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
      oddFooter: `&L&9Đợt thanh toán ${contract.contractNumber}&R&9Trang &P/&N`,
    },
  });
  sheet.columns = WIDTHS.map((width) => ({ width }));

  /** @param {number} row @param {string} range e.g. 'A:C' */
  const merge = (row, range) => {
    const [from, to] = range.split(':');
    sheet.mergeCells(`${from}${row}:${to}${row}`);
  };

  // Title block.
  merge(1, 'A:J');
  const title = sheet.getCell('A1');
  title.value = `ĐỢT THANH TOÁN HỢP ĐỒNG ${contract.contractNumber}`;
  title.font = font({ size: 18, bold: true, color: { argb: COLORS.accent } });
  title.alignment = { vertical: 'middle' };
  sheet.getRow(1).height = 32;

  merge(2, 'A:J');
  sheet.getCell('A2').value = [
    contract.customerName,
    `${contract.projectCode} · ${contract.projectName}`,
  ]
    .filter(Boolean)
    .join('  ·  ');
  sheet.getCell('A2').font = font({ bold: true });

  merge(3, 'A:J');
  sheet.getCell('A3').value =
    `${stages.length} đợt  ·  Hợp đồng ký ngày ${displayDay(new Date(`${contract.signedDate}T00:00:00`))}  ·  Xuất ngày ${displayDay(exportedAt)}`;
  sheet.getCell('A3').font = font({
    italic: true,
    color: { argb: COLORS.muted },
  });

  // Summary: three figures side by side.
  const summary = [
    ['A:C', 'GIÁ TRỊ QUYẾT TOÁN', contract.settlementValue, COLORS.ink],
    ['D:E', 'ĐÃ THANH TOÁN', contract.paidValue, COLORS.success],
    ['F:H', 'CHƯA THANH TOÁN', contract.unpaidValue, COLORS.danger],
  ];
  for (const [range, label, value, color] of summary) {
    merge(5, String(range));
    merge(6, String(range));
    const first = String(range).split(':')[0];
    const labelCell = sheet.getCell(`${first}5`);
    labelCell.value = String(label);
    labelCell.font = font({
      size: 9,
      bold: true,
      color: { argb: COLORS.muted },
    });
    const valueCell = sheet.getCell(`${first}6`);
    valueCell.value = Number(value);
    valueCell.numFmt = '#,##0" VND"';
    valueCell.font = font({
      size: 14,
      bold: true,
      color: { argb: String(color) },
    });
    for (const row of [5, 6]) {
      const [from, to] = String(range).split(':');
      for (let c = from.charCodeAt(0); c <= to.charCodeAt(0); c += 1) {
        sheet.getCell(`${String.fromCharCode(c)}${row}`).fill = fill(
          COLORS.summary,
        );
      }
    }
    labelCell.alignment = { vertical: 'middle', indent: 1 };
    valueCell.alignment = { vertical: 'middle', indent: 1 };
  }
  sheet.getRow(5).height = 20;
  sheet.getRow(6).height = 26;

  // Column header.
  const header = sheet.getRow(HEADER_ROW);
  header.values = HEADER;
  header.height = 30;
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

  let rowNumber = HEADER_ROW;
  /** @type {number[]} */
  const bandRows = [];
  for (const stage of stages) {
    // Stage band: totals of its payments, as formulas over the rows below.
    rowNumber += 1;
    const bandRow = rowNumber;
    bandRows.push(bandRow);
    const first = bandRow + 1;
    const last = bandRow + stage.subInstallments.length;
    const status = stageStatus(stage);
    const band = sheet.getRow(bandRow);
    band.height = 24;
    const sumOf = (
      /** @type {string} */ column,
      /** @type {number} */ result,
    ) => ({
      formula:
        stage.subInstallments.length > 0
          ? `SUM(${column}${first}:${column}${last})`
          : '0',
      result,
    });
    const stagePaid = stage.subInstallments.reduce(
      (s, sub) => s + paidOf(sub),
      0,
    );
    const stageTotal = stage.subInstallments.reduce(
      (s, sub) => s + sub.valueAfterTax,
      0,
    );
    band.getCell(1).value = `Đợt ${stage.number}`;
    sheet.mergeCells(`B${bandRow}:C${bandRow}`);
    band.getCell(2).value = stage.note ?? '';
    band.getCell(4).value = sumOf('D', stageTotal);
    band.getCell(5).value = sumOf('E', stagePaid);
    band.getCell(6).value = sumOf('F', stageTotal - stagePaid);
    band.getCell(7).value = status.label;
    sheet.mergeCells(`H${bandRow}:J${bandRow}`);
    band.getCell(8).value = `${stage.subInstallments.length} lần thanh toán`;
    for (let c = 1; c <= COLUMN_COUNT; c += 1) {
      const cell = band.getCell(c);
      cell.fill = fill(COLORS.band);
      cell.border = BORDER;
      cell.font = font({ bold: true });
      cell.alignment = { vertical: 'middle' };
      if (c >= 4 && c <= 6) {
        cell.numFmt = MONEY;
        cell.alignment = { vertical: 'middle', horizontal: 'right' };
      }
    }
    band.getCell(1).font = font({
      bold: true,
      size: 12,
      color: { argb: COLORS.accent },
    });
    band.getCell(2).font = font({
      italic: true,
      color: { argb: COLORS.muted },
    });
    band.getCell(7).font = font({ bold: true, color: { argb: status.color } });
    band.getCell(7).alignment = { vertical: 'middle', horizontal: 'center' };
    band.getCell(8).font = font({ color: { argb: COLORS.muted } });
    band.getCell(8).alignment = { vertical: 'middle', horizontal: 'right' };

    // The payments, indented one level (outline level 1).
    for (const sub of stage.subInstallments) {
      rowNumber += 1;
      const row = sheet.getRow(rowNumber);
      row.outlineLevel = 1;
      const isPaid = sub.status === 'Paid';
      row.getCell(1).value = `Lần ${sub.code}`;
      row.getCell(2).value =
        sub.kind === 'Percent' ? 'Theo tỷ lệ' : 'Theo giá trị';
      row.getCell(3).value = sub.kind === 'Percent' ? sub.percent : null;
      row.getCell(4).value = sub.valueAfterTax;
      row.getCell(5).value = paidOf(sub);
      row.getCell(6).value = sub.valueAfterTax - paidOf(sub);
      row.getCell(7).value = isPaid ? 'Đã thanh toán' : 'Kế hoạch';
      row.getCell(8).value = toDate(sub.paymentDate);
      row.getCell(9).value = sub.condition;
      row.getCell(10).value = sub.note;
      for (let c = 1; c <= COLUMN_COUNT; c += 1) {
        const cell = row.getCell(c);
        cell.font = font();
        cell.border = BORDER;
        cell.alignment = { vertical: 'middle', wrapText: c >= 9 };
      }
      row.getCell(1).alignment = { vertical: 'middle', indent: 2 };
      row.getCell(3).numFmt = '0.##';
      row.getCell(3).alignment = { vertical: 'middle', horizontal: 'right' };
      for (const c of [4, 5, 6]) {
        row.getCell(c).numFmt = MONEY;
        row.getCell(c).alignment = { vertical: 'middle', horizontal: 'right' };
      }
      row.getCell(5).font = font({ color: { argb: COLORS.success } });
      row.getCell(6).font = font({ color: { argb: COLORS.danger } });
      row.getCell(7).font = font({
        color: { argb: isPaid ? COLORS.success : COLORS.muted },
      });
      row.getCell(7).alignment = { vertical: 'middle', horizontal: 'center' };
      row.getCell(8).numFmt = DATE;
      row.getCell(8).alignment = { vertical: 'middle', horizontal: 'center' };
    }
    rowNumber = Math.max(rowNumber, bandRow);
  }

  // Grand total over the stage bands.
  rowNumber += 1;
  const total = sheet.getRow(rowNumber);
  total.height = 26;
  const grand = stages.reduce(
    (acc, stage) => {
      const amount = stage.subInstallments.reduce(
        (s, sub) => s + sub.valueAfterTax,
        0,
      );
      const paid = stage.subInstallments.reduce((s, sub) => s + paidOf(sub), 0);
      return { amount: acc.amount + amount, paid: acc.paid + paid };
    },
    { amount: 0, paid: 0 },
  );
  sheet.mergeCells(`A${rowNumber}:C${rowNumber}`);
  total.getCell(1).value = 'TỔNG CỘNG';
  const cells = [
    [4, 'D', grand.amount],
    [5, 'E', grand.paid],
    [6, 'F', grand.amount - grand.paid],
  ];
  for (const [index, column, result] of cells) {
    total.getCell(Number(index)).value = {
      formula:
        bandRows.length > 0
          ? bandRows.map((row) => `${column}${row}`).join('+')
          : '0',
      result: Number(result),
    };
  }
  sheet.mergeCells(`G${rowNumber}:J${rowNumber}`);
  total.getCell(7).value =
    `${stages.reduce((s, st) => s + st.subInstallments.length, 0)} lần thanh toán`;
  for (let c = 1; c <= COLUMN_COUNT; c += 1) {
    const cell = total.getCell(c);
    cell.fill = fill(COLORS.accent);
    cell.border = BORDER;
    cell.font = font({ bold: true, color: { argb: COLORS.onAccent } });
    cell.alignment = {
      vertical: 'middle',
      horizontal: c >= 4 && c <= 6 ? 'right' : 'left',
      indent: c === 1 ? 1 : 0,
    };
    if (c >= 4 && c <= 6) cell.numFmt = MONEY;
  }
  return workbook;
}
