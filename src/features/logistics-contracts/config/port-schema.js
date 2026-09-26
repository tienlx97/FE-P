import { z } from 'zod';

/**
 * Mirrors the backend's `CreatePortCommandValidator` (BE-kt-xnk
 * `port-catalog-unlocode`): UN/LOCODE = 2-letter country code + 3
 * characters (A–Z, 2–9); the BE also checks the prefix against the
 * country's ISO code and uniqueness (409). A `Facility` (nhà máy / kho)
 * has no UN/LOCODE — its code is dropped.
 */
export const portSchema = z
  .object({
    kind: z.enum(['Port', 'Facility']),
    countryId: z.string().trim().min(1, 'Vui lòng chọn nước'),
    code: z.string().trim().toUpperCase(),
    name: z
      .string()
      .trim()
      .min(1, 'Vui lòng nhập tên')
      .max(100, 'Tối đa 100 ký tự'),
    fullName: z.string().trim().max(300, 'Tối đa 300 ký tự'),
  })
  .superRefine((values, ctx) => {
    if (values.kind === 'Port' && !/^[A-Z]{2}[A-Z2-9]{3}$/.test(values.code)) {
      ctx.addIssue({
        code: 'custom',
        path: ['code'],
        message: 'Mã UN/LOCODE gồm 5 ký tự, VD: VNCLI',
      });
    }
  })
  .transform((values) =>
    values.kind === 'Facility' ? { ...values, code: '' } : values,
  );
