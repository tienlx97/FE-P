import { z } from 'zod';

import { SHIPMENT_CONTAINER_TYPES } from './shipment-container-types.js';

/**
 * Mirrors the backend's `CreateShipmentVgmCommandValidator`/
 * `UpdateShipmentVgmCommandValidator` (BE-kt-xnk). `sequenceNumber` is
 * system-assigned and never part of this form; `grossWeight`/`vgm` are
 * computed by the backend from the other fields and also never part of
 * this form. Only `packingDate`/`carrierCustomerId` are required among
 * the "Thông tin bổ sung" fields — the backend leaves
 * `plannedPackingTime`/`actualPackingTime`/`truckArrivalTime`/`note`
 * optional, so they're plain (non-min-length) strings here too.
 */
export const shipmentVgmSchema = z.object({
  containerNumber: z
    .string()
    .trim()
    .min(1, 'Vui lòng nhập tên cont')
    .max(50, 'Tối đa 50 ký tự'),
  sealNumber: z
    .string()
    .trim()
    .min(1, 'Vui lòng nhập tên seal')
    .max(50, 'Tối đa 50 ký tự'),
  containerType: z.enum(SHIPMENT_CONTAINER_TYPES, {
    error: 'Vui lòng chọn loại cont',
  }),
  tare: z
    .number({ error: 'Vui lòng nhập tare' })
    .positive('Giá trị phải lớn hơn 0'),
  payload: z
    .number({ error: 'Vui lòng nhập payload' })
    .positive('Giá trị phải lớn hơn 0'),
  maxGross: z
    .number({ error: 'Vui lòng nhập max gross' })
    .positive('Giá trị phải lớn hơn 0'),
  netWeight: z
    .number({ error: 'Vui lòng nhập net weight' })
    .positive('Giá trị phải lớn hơn 0'),
  packagingWeight: z
    .number({ error: 'Vui lòng nhập khối lượng bao bì' })
    .min(0, 'Không được âm'),
  packingDate: z.string().trim().min(1, 'Vui lòng chọn ngày đóng hàng'),
  plannedPackingTime: z.string(),
  actualPackingTime: z.string(),
  truckArrivalTime: z.string(),
  carrierCustomerId: z
    .string()
    .trim()
    .min(1, 'Vui lòng chọn nhà cung cấp vận chuyển'),
  note: z.string().trim().max(2000, 'Tối đa 2000 ký tự'),
});
