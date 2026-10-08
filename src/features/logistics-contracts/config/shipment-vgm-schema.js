import { z } from 'zod';

import { SHIPMENT_CONTAINER_TYPES } from './shipment-container-types.js';

/** The container's own weights (CSC plate / BIC BoxTech). */
const CONTAINER_WEIGHTS = /** @type {const} */ ([
  'maxGross',
  'tare',
  'payload',
]);

/**
 * Mirrors the backend's `ShipmentVgmWeights` (create / update / bulk
 * validators, BE-P `container-specs-boxtech`). Container first, VGM later
 * (2026-09-27): only the container number and type are required — a
 * container is recorded at empty pickup. Its weights (max gross / tare /
 * payload) may come then, alone; the VGM declaration (net weight +
 * packaging) comes after packing, both together and only with the three
 * container weights. `sequenceNumber` / `grossWeight` / `vgm` are never
 * part of this form.
 */
export const shipmentVgmSchema = z
  .object({
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
    emptyPickupDepotId: z.string(),
    note: z.string().trim().max(2000, 'Tối đa 2000 ký tự'),
  })
  .superRefine((values, context) => {
    const hasNet = values.netWeight !== undefined;
    const hasPackaging = values.packagingWeight !== undefined;
    if (!hasNet && !hasPackaging) return;
    /** @param {string} key @param {string} message */
    const issue = (key, message) =>
      context.addIssue({ code: 'custom', path: [key], message });
    if (!hasNet) issue('netWeight', 'Nhập cùng khối lượng bao bì');
    if (!hasPackaging) issue('packagingWeight', 'Nhập cùng net weight');
    for (const key of CONTAINER_WEIGHTS) {
      if (values[key] === undefined) {
        issue(key, 'Khai VGM cần tare, payload và max gross của container');
      }
    }
  });
