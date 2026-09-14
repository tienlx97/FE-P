import { z } from 'zod';

/**
 * Mirrors the backend's `CreateCustomerGroupCommandValidator` /
 * `CreateSupplierGroupCommandValidator` (BE-kt-xnk, identical rules for
 * both) — `Name` is the only field, max 200 chars.
 */
export const partyGroupSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Vui lòng nhập tên nhóm')
    .max(200, 'Tối đa 200 ký tự'),
});
