import { z } from 'zod';

/**
 * Mirrors the backend's `CreatePortCommandValidator` (BE-kt-xnk
 * `port-catalog-unlocode`): UN/LOCODE = 2-letter country code + 3
 * characters (A–Z, 2–9); the BE also checks the prefix against the
 * country's ISO code and uniqueness (409).
 */
export const portSchema = z.object({
  countryId: z.string().trim().min(1, 'Vui lòng chọn nước'),
  code: z
    .string()
    .trim()
    .toUpperCase()
    .regex(/^[A-Z]{2}[A-Z2-9]{3}$/, 'Mã UN/LOCODE gồm 5 ký tự, VD: VNCLI'),
  name: z
    .string()
    .trim()
    .min(1, 'Vui lòng nhập tên cảng')
    .max(100, 'Tối đa 100 ký tự'),
  fullName: z.string().trim().max(300, 'Tối đa 300 ký tự'),
});
