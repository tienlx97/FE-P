import { z } from 'zod';

import { CURRENCY_CODES } from './currencies.js';
import { PAYMENT_TYPES } from './payment-schedule-types.js';
import { MAX_TRANSSHIPMENT_LEGS } from './shipment-documents.js';
import { SHIPMENT_CUSTOMS_CHANNELS } from './shipment-operational-details.js';
import { freeTimeErrors } from './shipment-schedule.js';
import {
  requiresDeclarationFigures,
  SHIPMENT_STATUSES,
} from './shipment-status.js';
import { SHIPMENT_TYPES } from './shipment-types.js';

/** One side's free time as edited ('' mode = none agreed). */
export const freeTimeFormSchema = z.object({
  mode: z.union([z.enum(['Separate', 'Combined']), z.literal('')]),
  demDays: z.number().optional(),
  detDays: z.number().optional(),
  combinedDays: z.number().optional(),
});

/**
 * Adds the free-time errors of one side at `<field>.<days field>`.
 * @param {import('../types/index.js').FreeTimeFormValues} values
 * @param {string} field
 * @param {import('zod').RefinementCtx} context
 */
export function addFreeTimeIssues(values, field, context) {
  for (const [key, message] of Object.entries(freeTimeErrors(values))) {
    context.addIssue({ code: 'custom', path: [field, key], message });
  }
}

/**
 * Mirrors the backend's `ShipmentCost` validation (BE-kt-xnk):
 * `costCategoryId`/`name` required, `amount` must be > 0. `note` is
 * optional, max 500 chars. `providerCustomerId` and `invoiceNumber` ("Số
 * hoá đơn") are both optional — not every cost line has a known provider
 * or invoice yet; so is `invoiceDate` ("Ngày xuất hoá đơn", ISO date or
 * ''). `costNature` is Standard or Abnormal (incident cost).
 */
export const shipmentCostLineSchema = z.object({
  costCategoryId: z.string().trim().min(1, 'Vui lòng chọn nhóm chi phí'),
  name: z
    .string()
    .trim()
    .min(1, 'Vui lòng nhập tên khoản chi phí')
    .max(200, 'Tối đa 200 ký tự'),
  amount: z
    .number({ error: 'Vui lòng nhập số tiền' })
    .positive('Số tiền phải lớn hơn 0'),
  quantity: z
    .number({ error: 'Vui lòng nhập số lượng' })
    .positive('Số lượng phải lớn hơn 0'),
  // Markdown from the rich text editor (BE `ShipmentCost.NoteMaxLength`).
  note: z.string().trim().max(2000, 'Tối đa 2000 ký tự (kể cả định dạng)'),
  providerCustomerId: z.string().trim(),
  invoiceNumber: z.string().trim().max(100, 'Tối đa 100 ký tự'),
  invoiceDate: z.string(),
  costNature: z.enum(['Standard', 'Abnormal']),
});

/**
 * Cross-field checks run even when another field fails its type: zod skips
 * refinements after such an issue (an unset enum on an empty form), so
 * these errors would only appear once those fields were chosen.
 */
const RUN_DESPITE_FIELD_ERRORS = {
  when: (/** @type {{ value: unknown }} */ payload) =>
    typeof payload.value === 'object' && payload.value !== null,
};

/** Required-from-the-yard message per declaration figure. */
const DECLARATION_FIGURE_MESSAGES = /** @type {const} */ ([
  ['declarationValue', 'Bắt buộc từ “Hạ bãi chờ xuất”: nhập giá trị tờ khai'],
  [
    'declarationExchangeRate',
    'Bắt buộc từ “Hạ bãi chờ xuất”: nhập tỷ giá tờ khai',
  ],
  ['quantityAmount', 'Bắt buộc từ “Hạ bãi chờ xuất”: nhập số lượng'],
  [
    'declarationWeightKg',
    'Bắt buộc từ “Hạ bãi chờ xuất”: nhập khối lượng tờ khai',
  ],
]);

/**
 * Mirrors the backend's `CreateShipmentCommandValidator`/
 * `UpdateShipmentCommandValidator` (BE-kt-xnk). `shipmentNumber`/
 * `shipmentCode` are system-assigned and never part of this form; neither
 * is `quantityUnit` any more (2026-09-03) — it's derived from `type` on
 * the backend (LCL is always Kiện, FCL always Cont), never a client
 * input. `paymentCondition` reuses the same `TT`/`LC` set as
 * `PaymentSchedule`. `invoiceCurrency`/`declarationCurrency` are
 * constrained to the curated `CURRENCY_CODES` shortlist here (same choice
 * as `contract-schema.js`'s `currency`), narrower than the backend's free
 * 3-letter-code regex. `costLines` may be empty — a shipment can have no
 * logistics costs recorded yet.
 */
export const shipmentSchema = z
  .object({
    supplierCustomerId: z.string().trim().min(1, 'Vui lòng chọn forwarder'),
    customsBrokerIds: z.array(z.string()),
    truckingIds: z.array(z.string()),
    bookingNumber: z
      .string()
      .trim()
      .min(1, 'Vui lòng nhập số booking')
      .max(100, 'Tối đa 100 ký tự'),
    billOfLadingNumber: z.string().trim().max(100, 'Tối đa 100 ký tự'),
    shippingLine: z.string().trim().max(100, 'Tối đa 100 ký tự'),
    vesselName: z.string().trim().max(200, 'Tối đa 200 ký tự'),
    etd: z.string(),
    eta: z.string(),
    placeOfLoading: z.string().trim().max(200, 'Tối đa 200 ký tự'),
    placeOfDischarge: z.string().trim().max(200, 'Tối đa 200 ký tự'),
    placeOfDelivery: z.string().trim().max(500, 'Tối đa 500 ký tự'),
    // Markdown from the rich text editor (BE `Shipment.NoteMaxLength`).
    note: z.string().trim().max(2000, 'Tối đa 2000 ký tự (kể cả định dạng)'),
    type: z.enum(SHIPMENT_TYPES, { error: 'Vui lòng chọn loại hình' }),
    name: z
      .string()
      .trim()
      .min(1, 'Vui lòng nhập tên lô hàng')
      .max(200, 'Tối đa 200 ký tự'),
    paymentCondition: z.enum(PAYMENT_TYPES, {
      error: 'Vui lòng chọn điều kiện thanh toán',
    }),
    invoiceValue: z
      .number({ error: 'Vui lòng nhập giá trị invoice' })
      .positive('Giá trị phải lớn hơn 0'),
    invoiceCurrency: z.enum(CURRENCY_CODES, {
      error: 'Vui lòng chọn đơn vị tiền tệ',
    }),
    // Declaration figures: optional while Booked / Packing, required from
    // AtYardAwaitingExport (superRefine below, BE `DeclarationFigureRules`).
    declarationValue: z.number().positive('Giá trị phải lớn hơn 0').optional(),
    declarationCurrency: z.enum(CURRENCY_CODES, {
      error: 'Vui lòng chọn đơn vị tiền tệ',
    }),
    declarationExchangeRate: z
      .number()
      .positive('Tỷ giá phải lớn hơn 0')
      .optional(),
    quantityAmount: z.number().positive('Số lượng phải lớn hơn 0').optional(),
    declarationWeightKg: z
      .number()
      .positive('Khối lượng phải lớn hơn 0')
      .optional(),
    coNumber: z.string().trim().max(50, 'Tối đa 50 ký tự'),
    coDeclarationDate: z.string(),
    coIssuedDate: z.string(),
    customsDeclarationNumber: z.string().trim().max(50, 'Tối đa 50 ký tự'),
    customsDeclarationDate: z.string(),
    customsInspected: z.boolean(),
    costLines: z.array(shipmentCostLineSchema),
    goodsLines: z.record(
      z.string(),
      z.number().nonnegative('Số lượng không được âm').optional(),
    ),
    consigneeOverride: z.any().nullable(),
    notifyPartyOverride: z.any().nullable(),
    status: z.enum(SHIPMENT_STATUSES, { error: 'Vui lòng chọn tình trạng' }),
    invoiceNumber: z.string().trim().max(100, 'Tối đa 100 ký tự'),
    voyageNumber: z.string().trim().max(50, 'Tối đa 50 ký tự'),
    siCutoffDate: z.string(),
    siCutoffTime: z.string(),
    serviceTerm: z.string().trim().max(20, 'Tối đa 20 ký tự'),
    isTransshipment: z.boolean(),
    transshipmentLegs: z
      .array(
        z.object({
          port: z.string().trim().max(200, 'Tối đa 200 ký tự'),
          vesselName: z.string().trim().max(200).nullable(),
          voyageNumber: z.string().trim().max(50).nullable(),
          eta: z.string().nullable(),
          ata: z.string().nullable(),
          etd: z.string().nullable(),
          atd: z.string().nullable(),
        }),
      )
      .max(
        MAX_TRANSSHIPMENT_LEGS,
        `Tối đa ${MAX_TRANSSHIPMENT_LEGS} cảng chuyển tải`,
      ),
    coForm: z.string().trim().max(20, 'Tối đa 20 ký tự'),
    customsChannel: z.union([z.enum(SHIPMENT_CUSTOMS_CHANNELS), z.literal('')]),
    letterOfCreditNumber: z.string().trim().max(100, 'Tối đa 100 ký tự'),
    emptyReturnDeadline: z.string(),
    cyCutoffDate: z.string(),
    cyCutoffTime: z.string(),
    actualDeparture: z.string(),
    actualArrival: z.string(),
    originFreeTime: freeTimeFormSchema,
    destinationFreeTime: freeTimeFormSchema,
  })
  .superRefine((values, context) => {
    if (!requiresDeclarationFigures(values.status)) return;
    for (const [field, message] of DECLARATION_FIGURE_MESSAGES) {
      if (values[field] === undefined) {
        context.addIssue({ code: 'custom', path: [field], message });
      }
    }
  }, RUN_DESPITE_FIELD_ERRORS)
  .superRefine((values, context) => {
    if (values.isTransshipment && Array.isArray(values.transshipmentLegs)) {
      if (values.transshipmentLegs.length === 0) {
        context.addIssue({
          code: 'custom',
          path: ['transshipmentLegs'],
          message: 'Vui lòng thêm ít nhất một cảng chuyển tải',
        });
      }
      values.transshipmentLegs.forEach((leg, index) => {
        if (!leg.port) {
          context.addIssue({
            code: 'custom',
            path: ['transshipmentLegs', index, 'port'],
            message: 'Vui lòng nhập cảng chuyển tải',
          });
        }
      });
    }
    // "Hạn nộp SI / VGM" is one date-time on the backend: a time alone has
    // nothing to attach to.
    if (values.siCutoffTime && !values.siCutoffDate) {
      context.addIssue({
        code: 'custom',
        path: ['siCutoffDate'],
        message: 'Vui lòng chọn ngày',
      });
    }
    if (values.cyCutoffTime && !values.cyCutoffDate) {
      context.addIssue({
        code: 'custom',
        path: ['cyCutoffDate'],
        message: 'Vui lòng chọn ngày',
      });
    }
    addFreeTimeIssues(values.originFreeTime, 'originFreeTime', context);
    addFreeTimeIssues(
      values.destinationFreeTime,
      'destinationFreeTime',
      context,
    );
  }, RUN_DESPITE_FIELD_ERRORS);
