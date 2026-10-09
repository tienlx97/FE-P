import { z } from 'zod';

/** Mirrors BE-P `CreateAccountingSourceCommandValidator`. */
export const sourceSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Vui lòng nhập tên nguồn')
    .max(200, 'Tối đa 200 ký tự'),
  note: z.string().trim().max(1000, 'Tối đa 1000 ký tự'),
});

/** Mirrors BE-P `AccountingCustomerInputValidator`; blanks are sent as null. */
export const customerSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Vui lòng nhập tên khách hàng')
    .max(300, 'Tối đa 300 ký tự'),
  taxCode: z.string().trim().max(50, 'Tối đa 50 ký tự'),
  address: z.string().trim().max(500, 'Tối đa 500 ký tự'),
  phone: z.string().trim().max(50, 'Tối đa 50 ký tự'),
  email: z
    .string()
    .trim()
    .max(200, 'Tối đa 200 ký tự')
    .refine(
      (value) => value === '' || z.email().safeParse(value).success,
      'Email không hợp lệ',
    ),
  contactPerson: z.string().trim().max(200, 'Tối đa 200 ký tự'),
  note: z.string().trim().max(1000, 'Tối đa 1000 ký tự'),
});

/** @param {string} value */
export function blankToNull(value) {
  return value.trim() === '' ? null : value.trim();
}
