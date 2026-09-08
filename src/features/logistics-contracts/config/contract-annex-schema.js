import { z } from 'zod';

import { CONTRACT_ANNEX_TYPES } from './contract-annex-types.js';

/**
 * Mirrors the backend's `CreateContractAnnexCommandValidator`/
 * `UpdateContractAnnexCommandValidator` (BE-kt-xnk): `type` must be one of
 * the fixed set, `signedDate` is required. `ValueChange` describes a
 * non-monetary information change, so it requires `note` instead of a
 * positive `amount` — the other two types (money deltas) require the
 * reverse. `annexNumber`/`annexCode` are system-assigned and never part of
 * this form.
 */
export const contractAnnexSchema = z
  .object({
    type: z.enum(CONTRACT_ANNEX_TYPES, { error: 'Vui lòng chọn loại phụ lục' }),
    amount: z.number().nonnegative().optional(),
    signedDate: z.string().trim().min(1, 'Vui lòng chọn ngày ký'),
    buyerSigned: z.boolean(),
    sellerSigned: z.boolean(),
    note: z.string().trim(),
  })
  .transform((values) => ({ ...values, amount: values.amount ?? 0 }))
  .superRefine((values, ctx) => {
    if (values.type === 'ValueChange') {
      if (!values.note) {
        ctx.addIssue({
          code: 'custom',
          path: ['note'],
          message: 'Vui lòng nhập ghi chú',
        });
      }
      return;
    }

    if (!(values.amount > 0)) {
      ctx.addIssue({
        code: 'custom',
        path: ['amount'],
        message: 'Số tiền phải lớn hơn 0',
      });
    }
  });
