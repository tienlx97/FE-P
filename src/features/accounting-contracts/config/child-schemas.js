import { z } from 'zod';

/** Labels of BE-P `AccountingAppendixType`. */
export const APPENDIX_TYPE_OPTIONS = [
  { value: 'Increase', label: 'Phát sinh tăng' },
  { value: 'Decrease', label: 'Phát sinh giảm' },
  { value: 'InfoChange', label: 'Thay đổi thông tin' },
];

export const PAYMENT_KIND_OPTIONS = [
  { value: 'Percent', label: 'Theo %' },
  { value: 'Quantity', label: 'Theo số tiền' },
];

export const PAYMENT_STATUS_OPTIONS = [
  { value: 'Planned', label: 'Kế hoạch' },
  { value: 'Paid', label: 'Đã thanh toán' },
];

/**
 * @param {ReadonlyArray<{ value: string, label: string }>} options
 * @param {string} value
 */
export function labelOf(options, value) {
  return options.find((option) => option.value === value)?.label ?? value;
}

/** "Thay đổi thông tin" carries no money; the others need a value before tax > 0. */
export const appendixSchema = z
  .object({
    type: z.enum(['Increase', 'Decrease', 'InfoChange'], {
      error: 'Vui lòng chọn loại phụ lục',
    }),
    valueBeforeTax: z.number().nonnegative().optional(),
    signedDate: z.string().min(1, 'Vui lòng chọn ngày ký'),
    buyerSigned: z.boolean(),
    sellerSigned: z.boolean(),
    note: z.string().max(1000, 'Tối đa 1000 ký tự'),
  })
  .superRefine((values, ctx) => {
    if (values.type !== 'InfoChange' && !((values.valueBeforeTax ?? 0) > 0)) {
      ctx.addIssue({
        code: 'custom',
        path: ['valueBeforeTax'],
        message: 'Giá trị trước thuế phải lớn hơn 0',
      });
    }
  });

export const invoiceSchema = z.object({
  invoiceNumber: z
    .string()
    .trim()
    .min(1, 'Vui lòng nhập số hoá đơn')
    .max(50, 'Tối đa 50 ký tự'),
  issuedDate: z.string().min(1, 'Vui lòng chọn ngày xuất'),
  valueBeforeTax: z
    .number({ error: 'Vui lòng nhập giá trị trước thuế' })
    .positive('Giá trị phải lớn hơn 0'),
  taxRatePercent: z
    .number({ error: 'Vui lòng nhập thuế' })
    .min(0, 'Thuế từ 0 đến 100%')
    .max(100, 'Thuế từ 0 đến 100%'),
  note: z.string().max(1000, 'Tối đa 1000 ký tự'),
});

/** Percent needs 0 < % ≤ 100; Quantity needs a value before tax ≥ 0. */
export const subInstallmentSchema = z
  .object({
    kind: z.enum(['Percent', 'Quantity']),
    percent: z.number().optional(),
    valueBeforeTax: z.number().optional(),
    taxRatePercent: z
      .number({ error: 'Vui lòng nhập thuế' })
      .min(0, 'Thuế từ 0 đến 100%')
      .max(100, 'Thuế từ 0 đến 100%'),
    actualPaidAmount: z
      .number()
      .nonnegative('Giá trị thực tế không được âm')
      .optional(),
    condition: z.string().max(1000, 'Tối đa 1000 ký tự'),
    paymentDate: z.string(),
    status: z.enum(['Planned', 'Paid']),
    note: z.string().max(1000, 'Tối đa 1000 ký tự'),
  })
  .superRefine((values, ctx) => {
    if (
      values.kind === 'Percent' &&
      !(values.percent != null && values.percent > 0 && values.percent <= 100)
    ) {
      ctx.addIssue({
        code: 'custom',
        path: ['percent'],
        message: 'Tỷ lệ từ trên 0 đến 100%',
      });
    }
    if (
      values.kind === 'Quantity' &&
      !(values.valueBeforeTax != null && values.valueBeforeTax >= 0)
    ) {
      ctx.addIssue({
        code: 'custom',
        path: ['valueBeforeTax'],
        message: 'Vui lòng nhập giá trị thanh toán',
      });
    }
  });

export const installmentSchema = z.object({
  note: z.string().max(1000, 'Tối đa 1000 ký tự'),
  subInstallments: z
    .array(subInstallmentSchema)
    .min(1, 'Cần ít nhất một lần thanh toán'),
});
