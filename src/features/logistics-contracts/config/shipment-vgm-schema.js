import { z } from 'zod';

import { SHIPMENT_CONTAINER_TYPES } from './shipment-container-types.js';

/** The VGM weights: entered together (declared) or not at all. */
const VGM_WEIGHTS = /** @type {const} */ ([
  'maxGross',
  'tare',
  'payload',
  'netWeight',
  'packagingWeight',
]);

/**
 * Mirrors the backend's `CreateShipmentVgmCommandValidator`/
 * `UpdateShipmentVgmCommandValidator` (BE-kt-xnk). Container first, VGM
 * later (2026-09-27): only the container number and type are required —
 * a container is recorded at empty pickup; seal, packing date, carrier and
 * the VGM weights come later. The weights are all-or-none. `sequenceNumber`
 * / `grossWeight` / `vgm` are never part of this form.
 */
export const shipmentVgmSchema = z.object({
  containerNumber: z
    .string()
    .trim()
    .min(1, 'Vui lòng nhập tên cont')
    .max(50, 'Tối đa 50 ký tự'),
  sealNumber: z.string().trim().max(50, 'Tối đa 50 ký tự'),
  containerType: z.enum(SHIPMENT_CONTAINER_TYPES, {
    error: 'Vui lòng chọn loại cont',
  }),
  tare: z.number().positive('Giá trị phải lớn hơn 0').optional(),
  payload: z.number().positive('Giá trị phải lớn hơn 0').optional(),
  maxGross: z.number().positive('Giá trị phải lớn hơn 0').optional(),
  netWeight: z.number().positive('Giá trị phải lớn hơn 0').optional(),
  packagingWeight: z.number().min(0, 'Không được âm').optional(),
  packingDate: z.string(),
  plannedPackingTime: z.string(),
  actualPackingTime: z.string(),
  truckArrivalTime: z.string(),
  carrierCustomerId: z.string(),
  note: z.string().trim().max(2000, 'Tối đa 2000 ký tự'),
}).superRefine((values, context) => {
  const entered = VGM_WEIGHTS.filter((key) => values[key] !== undefined);
  if (entered.length === 0 || entered.length === VGM_WEIGHTS.length) return;
  for (const key of VGM_WEIGHTS) {
    if (values[key] === undefined) {
      context.addIssue({
        code: 'custom',
        path: [key],
        message: 'Khai VGM cần đủ 5 khối lượng (hoặc để trống cả 5)',
      });
    }
  }
});
