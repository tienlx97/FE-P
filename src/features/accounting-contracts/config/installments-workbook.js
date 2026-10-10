/**
 * The "Xuất Excel" file of a contract's "Đợt thanh toán" tab. Content follows
 * the accountants' "Sale nội địa" sheet (BẢNG TỔNG HỢP DOANH THU): the
 * contract's value rows (trước VAT, VAT, phụ lục, giá trị quyết toán), then
 * one row per đợt with its lần as "n.1", "n.2" rows underneath when it has
 * several, and "Còn lại" running like that sheet (previous + số tiền − thực
 * tế đã TT). Styled like the other reports: title block, four headline
 * figures, cobalt column header, navy section bands, soft fills, paid in
 * green and outstanding in red, a cobalt totals row. Takes the ExcelJS
 * module as an argument so the caller can lazy-load it and tests can pass
 * the Node build.
 */

const COLORS = {
  accent: 'FF0064E0',
  onAccent: 'FFFFFFFF',
  section: 'FF1B3A6B',
  ink: 'FF1C2B33',
  muted: 'FF5F6368',
  line: 'FFD0D7E2',
  summary: 'FFF3F5F8',
  settlement: 'FFE7F0FD',
  parent: 'FFF6F8FB',
  success: 'FF0B7A4B',
  danger: 'FFC4281C',
};
const FONT = 'Inter';
const FONT_SIZE = 11;
const MONEY = '#,##0;-#,##0;"–"';
const DATE = 'dd/mm/yyyy';
const COLUMN_COUNT = 8;
const HEADER_ROW = 8;
const LAST_COLUMN = 'H';

const HEADER = [
  'Đợt',
  'Nội dung thanh toán theo hợp đồng',
  '%',
  'Số tiền (VND)',
  'Ngày thanh toán',
  'Thực tế đã thanh toán',
  'Còn lại',
  'Ghi chú',
];
const WIDTHS = [10, 62, 10, 20, 16, 21, 20, 36];
/** Columns (1-based) by meaning. */
const COL = {
  stage: 1,
  content: 2,
  percent: 3,
  amount: 4,
  date: 5,
  paid: 6,
  remaining: 7,
  note: 8,
};
const MONEY_COLUMNS = [COL.amount, COL.paid, COL.remaining];

const APPENDIX_LABELS = {
  Increase: 'Phát sinh tăng',
  Decrease: 'Phát sinh giảm',
};

const thin = /** @type {import('exceljs').Border} */ ({
  style: 'thin',
  color: { argb: COLORS.line },
});
/** @type {Partial<import('exceljs').Borders>} */
const BORDER = { top: thin, left: thin, bottom: thin, right: thin };

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

/** @param {string} iso */
const displayDay = (iso) => {
  const [year, month, day] = iso.slice(0, 10).split('-');
  return `${day}/${month}/${year}`;
};

/** @param {Date} date */
const displayDate = (date) =>
  `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}/${date.getFullYear()}`;

/** Percent number (20, 2.5) → its Excel format. */
const percentFormat = (/** @type {number} */ percent) =>
  Number.isInteger(percent) ? '0%' : '0.0#%';

/** Row height that fits the wrapped content / note text. */
function heightFor(/** @type {(string | null | undefined)[]} */ texts) {
  const lines = Math.max(
    1,
    ...texts.map((text, index) => {
      const width =
        index === 0 ? WIDTHS[COL.content - 1] : WIDTHS[COL.note - 1];
      return text ? Math.ceil(String(text).length / (width * 0.9)) : 1;
    }),
  );
  return Math.max(24, lines * 15 + 9);
}

/** What was actually received ("Giá trị thực tế thanh toán").
 * @param {import('../types/index.js').AccountingSubInstallment} sub */
const paidOf = (sub) => sub.actualPaidAmount ?? 0;

/** @param {string} contractNumber @param {Date} day */
export function installmentWorkbookFileName(contractNumber, day) {
  return `Dot-thanh-toan-${contractNumber}-${day.toISOString().slice(0, 10)}.xlsx`;
}

/**
 * @param {typeof import('exceljs')} ExcelJS
 * @param {{
 *   contract: import('../types/index.js').AccountingContractSummary,
 *   appendices?: import('../types/index.js').AccountingAppendix[],
 *   installments: import('../types/index.js').AccountingInstallment[],
 *   exportedAt: Date,
 * }} input
 */
export function buildInstallmentWorkbook(ExcelJS, input) {
  const { contract, exportedAt } = input;
  const stages = input.installments.slice().sort((a, b) => a.number - b.number);
  const appendices = (input.appendices ?? [])
    .filter((a) => a.type === 'Increase' || a.type === 'Decrease')
    .sort((a, b) => a.signedDate.localeCompare(b.signedDate));

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

  /** @param {number} row @param {string} from @param {string} to */
  const merge = (row, from, to) =>
    sheet.mergeCells(`${from}${row}:${to}${row}`);

  // Title block.
  merge(1, 'A', LAST_COLUMN);
  const title = sheet.getCell('A1');
  title.value = 'BẢNG CÁC ĐỢT THANH TOÁN';
  title.font = font({ size: 18, bold: true, color: { argb: COLORS.accent } });
  title.alignment = { vertical: 'middle' };
  sheet.getRow(1).height = 32;

  merge(2, 'A', LAST_COLUMN);
  sheet.getCell('A2').value =
    `Hợp đồng số ${contract.contractNumber}  ·  Ký ngày ${displayDay(contract.signedDate)}`;
  sheet.getCell('A2').font = font({ size: 12, bold: true });
  sheet.getRow(2).height = 20;

  merge(3, 'A', LAST_COLUMN);
  sheet.getCell('A3').value = [
    contract.customerName ? `Chủ đầu tư: ${contract.customerName}` : null,
    [contract.projectCode, contract.projectName].filter(Boolean).join(' - '),
    `Xuất ngày ${displayDate(exportedAt)}`,
  ]
    .filter(Boolean)
    .join('  ·  ');
  sheet.getCell('A3').font = font({
    italic: true,
    color: { argb: COLORS.muted },
  });

  // Column header.
  const header = sheet.getRow(HEADER_ROW);
  header.values = HEADER.map((text) => text.toUpperCase());
  header.height = 32;
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
  /** @param {number} [height] */
  const nextRow = (height = 24) => {
    rowNumber += 1;
    const row = sheet.getRow(rowNumber);
    row.height = height;
    return row;
  };

  /** Default look of one body cell: border, font, alignment, number format. */
  const base = (
    /** @type {import('exceljs').Cell} */ cell,
    /** @type {string} */ fillArgb = '',
  ) => {
    const column = Number(cell.col);
    cell.border = BORDER;
    cell.font = font();
    if (fillArgb) cell.fill = fill(fillArgb);
    cell.alignment = {
      vertical: 'middle',
      wrapText: column === COL.content || column === COL.note,
      horizontal:
        column === COL.percent || column === COL.date
          ? 'center'
          : MONEY_COLUMNS.includes(column)
            ? 'right'
            : undefined,
    };
    if (MONEY_COLUMNS.includes(column)) cell.numFmt = MONEY;
    if (column === COL.date) cell.numFmt = DATE;
  };

  /** A navy band across the table: "I. GIÁ TRỊ HỢP ĐỒNG" … */
  const sectionBand = (/** @type {string} */ label) => {
    const row = nextRow(24);
    merge(row.number, 'A', LAST_COLUMN);
    const cell = row.getCell(1);
    cell.value = label;
    cell.font = font({ bold: true, color: { argb: COLORS.onAccent } });
    cell.fill = fill(COLORS.section);
    cell.border = BORDER;
    cell.alignment = { vertical: 'middle', indent: 1 };
  };

  // I. Contract value: the template's value block.
  sectionBand('I. GIÁ TRỊ HỢP ĐỒNG');
  /** @param {string} label @param {import('exceljs').CellValue} amount @param {{ bold?: boolean, color?: string }} [look] */
  const valueRow = (label, amount, look = {}) => {
    const row = nextRow(heightFor([label]));
    row.getCell(COL.content).value = label;
    row.getCell(COL.amount).value = amount;
    for (let c = 1; c <= COLUMN_COUNT; c += 1)
      base(row.getCell(c), COLORS.summary);
    row.getCell(COL.content).font = font({ bold: look.bold });
    row.getCell(COL.content).alignment = {
      vertical: 'middle',
      wrapText: true,
      indent: 1,
    };
    row.getCell(COL.amount).font = font({
      bold: look.bold,
      color: { argb: look.color ?? COLORS.ink },
    });
    return row.number;
  };
  const beforeTaxRow = valueRow(
    'Giá trị hợp đồng trước VAT',
    contract.valueBeforeTax,
  );
  const taxRow = valueRow(
    `VAT ${contract.taxRatePercent}%`,
    contract.valueAfterTax - contract.valueBeforeTax,
  );
  const afterTaxRow = valueRow(
    'Giá trị hợp đồng sau VAT',
    { formula: `D${beforeTaxRow}+D${taxRow}`, result: contract.valueAfterTax },
    { bold: true },
  );
  const appendixRows = appendices.map((appendix, index) => {
    const isDecrease = appendix.type === 'Decrease';
    return valueRow(
      `Phụ lục số ${String(index + 1).padStart(2, '0')}  ·  ${APPENDIX_LABELS[/** @type {'Increase' | 'Decrease'} */ (appendix.type)]}  ·  ký ngày ${displayDay(appendix.signedDate)}`,
      (isDecrease ? -1 : 1) * appendix.valueAfterTax,
      { color: isDecrease ? COLORS.danger : COLORS.success },
    );
  });

  // Giá trị quyết toán: what the payments are measured against.
  const settlement = nextRow(28);
  const settlementRow = settlement.number;
  settlement.getCell(COL.content).value = 'GIÁ TRỊ QUYẾT TOÁN';
  settlement.getCell(COL.amount).value = {
    formula: [`D${afterTaxRow}`, ...appendixRows.map((r) => `D${r}`)].join('+'),
    result: contract.settlementValue,
  };
  for (let c = 1; c <= COLUMN_COUNT; c += 1) {
    const cell = settlement.getCell(c);
    base(cell, COLORS.settlement);
    cell.font = font({ bold: true, color: { argb: COLORS.accent } });
  }
  settlement.getCell(COL.content).alignment = { vertical: 'middle', indent: 1 };

  // II. Payments: one row per đợt; several lần → "n.1", "n.2" rows underneath.
  sectionBand('II. CÁC ĐỢT THANH TOÁN');
  /** @type {number[]} */
  const stageRows = [];
  let remaining = 0;
  let totalAmount = 0;
  let totalPaid = 0;
  for (const stage of stages) {
    const subs = stage.subInstallments;
    const single = subs.length === 1 ? subs[0] : null;
    const isParent = subs.length > 1;
    const stageAmount = subs.reduce((s, sub) => s + sub.valueAfterTax, 0);
    const stagePaid = subs.reduce((s, sub) => s + paidOf(sub), 0);
    totalAmount += stageAmount;
    totalPaid += stagePaid;
    const percents = subs.map((sub) =>
      sub.kind === 'Percent' ? sub.percent : null,
    );
    const stagePercent =
      percents.length > 0 && percents.every((p) => p !== null)
        ? percents.reduce((s, p) => s + Number(p), 0)
        : null;

    const content = single ? (single.condition ?? stage.note) : stage.note;
    const note = single ? single.note : null;
    const row = nextRow(heightFor([content, note]));
    const own = row.number;
    stageRows.push(own);
    for (let c = 1; c <= COLUMN_COUNT; c += 1) {
      base(row.getCell(c), isParent ? COLORS.parent : '');
    }
    row.getCell(COL.stage).value = `Đợt ${stage.number}`;
    row.getCell(COL.stage).font = font({
      bold: true,
      color: { argb: COLORS.accent },
    });
    row.getCell(COL.content).value = content;
    row.getCell(COL.content).font = font({ bold: isParent });
    if (stagePercent !== null) {
      row.getCell(COL.percent).value = stagePercent / 100;
      row.getCell(COL.percent).numFmt = percentFormat(stagePercent);
    }
    const first = own + 1;
    const last = own + subs.length;
    row.getCell(COL.amount).value = isParent
      ? { formula: `SUM(D${first}:D${last})`, result: stageAmount }
      : stageAmount;
    row.getCell(COL.amount).font = font({ bold: isParent });
    row.getCell(COL.date).value = single ? toDate(single.paymentDate) : null;
    row.getCell(COL.paid).value = isParent
      ? { formula: `SUM(F${first}:F${last})`, result: stagePaid }
      : stagePaid;
    row.getCell(COL.paid).font = font({
      bold: isParent,
      color: { argb: COLORS.success },
    });
    remaining += stageAmount - stagePaid;
    const previous = stageRows.at(-2);
    row.getCell(COL.remaining).value = {
      formula: previous ? `G${previous}+D${own}-F${own}` : `D${own}-F${own}`,
      result: remaining,
    };
    row.getCell(COL.remaining).font = font({
      bold: true,
      color: { argb: remaining > 0 ? COLORS.danger : COLORS.success },
    });
    row.getCell(COL.note).value = note;
    row.getCell(COL.note).font = font({ color: { argb: COLORS.muted } });
    if (!isParent) continue;

    for (const sub of subs) {
      const subRow = nextRow(heightFor([sub.condition, sub.note]));
      subRow.outlineLevel = 1;
      for (let c = 1; c <= COLUMN_COUNT; c += 1) base(subRow.getCell(c));
      subRow.getCell(COL.stage).value = sub.code;
      subRow.getCell(COL.stage).font = font({ color: { argb: COLORS.muted } });
      subRow.getCell(COL.stage).alignment = {
        vertical: 'middle',
        horizontal: 'right',
      };
      subRow.getCell(COL.content).value = sub.condition;
      subRow.getCell(COL.content).alignment = {
        vertical: 'middle',
        wrapText: true,
        indent: 2,
      };
      if (sub.kind === 'Percent' && sub.percent !== null) {
        subRow.getCell(COL.percent).value = sub.percent / 100;
        subRow.getCell(COL.percent).numFmt = percentFormat(sub.percent);
      }
      subRow.getCell(COL.amount).value = sub.valueAfterTax;
      subRow.getCell(COL.date).value = toDate(sub.paymentDate);
      subRow.getCell(COL.paid).value = paidOf(sub);
      subRow.getCell(COL.paid).font = font({ color: { argb: COLORS.success } });
      subRow.getCell(COL.note).value = sub.note;
      subRow.getCell(COL.note).font = font({ color: { argb: COLORS.muted } });
    }
  }

  // Totals over the đợt rows (lần rows are already inside them).
  const sumOfStages = (/** @type {string} */ column) =>
    stageRows.length > 0
      ? stageRows.map((r) => `${column}${r}`).join('+')
      : '0';
  const total = nextRow(28);
  const totalRow = total.number;
  merge(totalRow, 'A', 'C');
  total.getCell(1).value = `TỔNG CỘNG  ·  ${stages.length} đợt`;
  total.getCell(COL.amount).value = {
    formula: sumOfStages('D'),
    result: totalAmount,
  };
  total.getCell(COL.paid).value = {
    formula: sumOfStages('F'),
    result: totalPaid,
  };
  total.getCell(COL.remaining).value = {
    formula: `D${totalRow}-F${totalRow}`,
    result: totalAmount - totalPaid,
  };
  for (let c = 1; c <= COLUMN_COUNT; c += 1) {
    const cell = total.getCell(c);
    base(cell, COLORS.accent);
    cell.font = font({ bold: true, color: { argb: COLORS.onAccent } });
  }
  total.getCell(1).alignment = { vertical: 'middle', indent: 1 };

  // The settlement row's paid / còn lại, measured on the payments.
  settlement.getCell(COL.paid).value = {
    formula: `F${totalRow}`,
    result: totalPaid,
  };
  settlement.getCell(COL.remaining).value = {
    formula: `D${settlementRow}-F${settlementRow}`,
    result: contract.settlementValue - totalPaid,
  };

  // Headline figures (rows 5–6), live formulas over the table.
  const figures = [
    [
      'A',
      'B',
      'GIÁ TRỊ QUYẾT TOÁN',
      `D${settlementRow}`,
      contract.settlementValue,
      COLORS.ink,
      '#,##0" VND"',
    ],
    [
      'C',
      'D',
      'ĐÃ THANH TOÁN',
      `F${settlementRow}`,
      totalPaid,
      COLORS.success,
      '#,##0" VND"',
    ],
    [
      'E',
      'F',
      'CÒN LẠI',
      `G${settlementRow}`,
      contract.settlementValue - totalPaid,
      COLORS.danger,
      '#,##0" VND"',
    ],
    [
      'G',
      'H',
      'TIẾN ĐỘ THANH TOÁN',
      `IF(D${settlementRow}=0,0,F${settlementRow}/D${settlementRow})`,
      contract.settlementValue ? totalPaid / contract.settlementValue : 0,
      COLORS.accent,
      '0.0%',
    ],
  ];
  for (const [from, to, label, formula, result, color, numFmt] of figures) {
    merge(5, String(from), String(to));
    merge(6, String(from), String(to));
    const labelCell = sheet.getCell(`${from}5`);
    labelCell.value = String(label);
    labelCell.font = font({
      size: 9,
      bold: true,
      color: { argb: COLORS.muted },
    });
    const valueCell = sheet.getCell(`${from}6`);
    valueCell.value = { formula: String(formula), result: Number(result) };
    valueCell.numFmt = String(numFmt);
    valueCell.font = font({
      size: 14,
      bold: true,
      color: { argb: String(color) },
    });
    for (const row of [5, 6]) {
      for (
        let c = String(from).charCodeAt(0);
        c <= String(to).charCodeAt(0);
        c += 1
      ) {
        const cell = sheet.getCell(`${String.fromCharCode(c)}${row}`);
        cell.fill = fill(COLORS.summary);
        // A white rule between the cards.
        cell.border = {
          left: { style: 'medium', color: { argb: COLORS.onAccent } },
          right: { style: 'medium', color: { argb: COLORS.onAccent } },
        };
      }
    }
    labelCell.alignment = { vertical: 'bottom', indent: 1 };
    valueCell.alignment = { vertical: 'middle', indent: 1 };
  }
  sheet.getRow(5).height = 20;
  sheet.getRow(6).height = 28;

  sheet.pageSetup.printArea = `A1:${LAST_COLUMN}${rowNumber}`;
  return workbook;
}
