import { z } from 'zod';

/**
 * Mirrors the backend's `CreateCountryCommandValidator` (BE-kt-xnk) — `Name`
 * max 200 chars, plus an optional ISO `Code`; uniqueness of both is
 * enforced server-side (409 on duplicate).
 */
export const countrySchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Vui lòng nhập tên nước')
    .max(200, 'Tối đa 200 ký tự'),
  // ISO 3166-1 alpha-2, optional (BE-kt-xnk `port-catalog-unlocode`).
  code: z
    .string()
    .trim()
    .toUpperCase()
    .regex(/^([A-Z]{2})?$/, 'Mã nước gồm 2 chữ cái, VD: VN'),
});
