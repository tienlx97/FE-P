import { z } from 'zod';

const paymentTermSchema = z.object({
  paymentRatioPercent: z
    .number({ error: 'Vui lòng nhập tỷ lệ' })
    .positive('Tỷ lệ phải lớn hơn 0'),
  paymentCondition: z
    .string()
    .trim()
    .min(1, 'Vui lòng nhập điều kiện thanh toán'),
});

export const commissionPaymentSchema = z.object({
  paymentDate: z.string().trim().min(1, 'Vui lòng chọn ngày thanh toán'),
  amount: z
    .number({ error: 'Vui lòng nhập giá trị' })
    .positive('Giá trị phải lớn hơn 0'),
  note: z.string().trim().max(500, 'Tối đa 500 ký tự'),
});

/**
 * Mirrors the backend's `CreateCommissionCommandValidator`/
 * `UpdateCommissionCommandValidator` (BE-kt-xnk). `code` is user-entered,
 * like `Contract.contractNumber` — the backend validates uniqueness on
 * submit (409 on collision), not this schema.
 */
export const commissionSchema = z.object({
  code: z.string().trim().min(1, 'Vui lòng nhập mã Commission').max(100, 'Tối đa 100 ký tự'),
  signedDate: z.string().trim().min(1, 'Vui lòng chọn ngày ký'),
  partyCustomerId: z.string().trim().min(1, 'Vui lòng chọn bên nhận hoa hồng'),
  value: z
    .number({ error: 'Vui lòng nhập giá trị' })
    .positive('Giá trị phải lớn hơn 0'),
  sellerSigned: z.boolean(),
  partySigned: z.boolean(),
  paymentTerms: z
    .array(paymentTermSchema)
    .min(1, 'Cần ít nhất 1 đợt thanh toán')
    .refine(
      (terms) =>
        Math.abs(terms.reduce((sum, term) => sum + term.paymentRatioPercent, 0) - 100) <
        0.01,
      { message: 'Tổng tỷ lệ các đợt thanh toán phải bằng 100%' },
    ),
  paymentHistory: z.array(commissionPaymentSchema),
});
