import { z } from 'zod';

/**
 * Mirrors the backend's `UpsertContractPrivateInfoCommandValidator`
 * (BE-kt-xnk): every numeric field is optional, and every one except
 * `profit` must be `>= 0` (profit can be negative — a loss). `ExtraFields`
 * isn't part of this schema — same as `contract-schema.js`'s
 * seller/buyer extras, it's a free-form Key/Value list validated by its
 * own `ExtraFieldsEditor` rows, not by this zod object.
 */
export const contractPrivateInfoSchema = z.object({
  boqSentDate: z.string(),
  containerCount: z
    .number({ error: 'Vui lòng nhập số' })
    .int('Số cont phải là số nguyên')
    .min(0, 'Không được âm')
    .optional(),
  costPricePerContainer: z
    .number({ error: 'Vui lòng nhập số' })
    .min(0, 'Không được âm')
    .optional(),
  quotedPricePerContainer: z
    .number({ error: 'Vui lòng nhập số' })
    .min(0, 'Không được âm')
    .optional(),
  unitCostLabor: z
    .number({ error: 'Vui lòng nhập số' })
    .min(0, 'Không được âm')
    .optional(),
  unitCostSandblasting: z
    .number({ error: 'Vui lòng nhập số' })
    .min(0, 'Không được âm')
    .optional(),
  unitCostPainting: z
    .number({ error: 'Vui lòng nhập số' })
    .min(0, 'Không được âm')
    .optional(),
  unitCostFactory: z
    .number({ error: 'Vui lòng nhập số' })
    .min(0, 'Không được âm')
    .optional(),
  volumeSale: z
    .number({ error: 'Vui lòng nhập số' })
    .min(0, 'Không được âm')
    .optional(),
  volumeMaterial: z
    .number({ error: 'Vui lòng nhập số' })
    .min(0, 'Không được âm')
    .optional(),
  profit: z.number({ error: 'Vui lòng nhập số' }).optional(),
  totalAmountUsd: z
    .number({ error: 'Vui lòng nhập số' })
    .min(0, 'Không được âm')
    .optional(),
  exchangeRateVnd: z
    .number({ error: 'Vui lòng nhập số' })
    .min(0, 'Không được âm')
    .optional(),
});
