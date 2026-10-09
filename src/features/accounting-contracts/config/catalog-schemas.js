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

/** @param {string} value */
export function blankToNull(value) {
  return value.trim() === '' ? null : value.trim();
}
