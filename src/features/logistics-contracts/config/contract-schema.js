import { z } from 'zod';

import { CONTRACT_STATUSES } from './contract-status.js';
import { CONTRACT_TYPES } from './contract-types.js';
import { CURRENCY_CODES } from './currencies.js';
import { INCOTERM_CODES, requiresPlaceOfDischarge } from './incoterms.js';

const CURRENT_YEAR = new Date().getFullYear();

const paymentTermSchema = z.object({
  paymentRatioPercent: z
    .number({ error: 'Vui lòng nhập tỷ lệ' })
    .positive('Tỷ lệ phải lớn hơn 0'),
  paymentCondition: z
    .string()
    .trim()
    .min(1, 'Vui lòng nhập điều kiện thanh toán'),
});

/**
 * Mirrors the backend's `CreateContractCommandValidator`/
 * `UpdateContractCommandValidator` (BE-kt-xnk): required header fields,
 * `contractValue > 0`, payment terms non-empty and summing to 100. Seller
 * (bên bán) and Party A must each reference a catalog entry
 * (`sourceSellerId`/`sourceCustomerId`) — the backend also accepts a
 * typed-in `CompanyName` with no source id, but this form doesn't offer that
 * path: "Thêm bên bán"/"Thêm khách hàng" (quick-create) is the only way to
 * add one not already in the catalog, so every Seller/Party A on a contract
 * created here ends up catalog-linked.
 * `companyId` is required — a contract always belongs to a company
 * (permissions are scoped by company, not branch; see
 * `docs/api/Contracts.md`, BE-kt-xnk).
 */
export const contractSchema = z
  .object({
    contractNumber: z.string().trim().min(1, 'Vui lòng nhập số hợp đồng'),
    contractType: z.enum(CONTRACT_TYPES, {
      error: 'Vui lòng chọn loại hợp đồng',
    }),
    createdDate: z.string().min(1, 'Vui lòng chọn ngày tạo hợp đồng'),
    quotationDate: z.string().min(1, 'Vui lòng chọn ngày báo giá'),
    projectName: z.string().trim().min(1, 'Vui lòng nhập tên dự án'),
    category: z.string().trim().min(1, 'Vui lòng nhập hạng mục'),
    countryId: z.string().trim().min(1, 'Vui lòng chọn nước xuất khẩu'),
    placeOfLoading: z
      .string()
      .trim()
      .min(1, 'Vui lòng nhập cảng xếp hàng')
      .max(200, 'Tối đa 200 ký tự'),
    // Required or blank depending on `incoterm` — see the cross-field
    // refine below (FOB/EXW end at origin, so `placeOfDischarge` must stay
    // empty; DDP/CIF carry through to a destination, so it's required).
    placeOfDischarge: z.string().trim().max(200, 'Tối đa 200 ký tự'),
    contractValue: z
      .number({ error: 'Vui lòng nhập giá trị hợp đồng' })
      .positive('Giá trị hợp đồng phải lớn hơn 0'),
    currency: z.enum(CURRENCY_CODES, { error: 'Vui lòng chọn đơn vị tiền tệ' }),
    incoterm: z.enum(INCOTERM_CODES, { error: 'Vui lòng chọn Incoterm' }),
    incotermYear: z
      .number({ error: 'Vui lòng nhập năm Incoterm' })
      .int()
      .min(2000, 'Năm Incoterm không hợp lệ')
      .max(CURRENT_YEAR + 1, 'Năm Incoterm không hợp lệ'),
    companyId: z.string().trim().min(1, 'Vui lòng chọn công ty'),
    sourceSellerId: z.string(),
    sellerInline: z.object({
      companyName: z.string().trim(),
      representativeName: z.string().trim(),
      representativeTitle: z.string().trim(),
      address: z.string().trim(),
    }),
    sourceCustomerId: z.string(),
    buyerInline: z.object({
      companyName: z.string().trim(),
      representativeName: z.string().trim(),
      representativeTitle: z.string().trim(),
      address: z.string().trim(),
    }),
    note: z.string().trim().max(2000, 'Tối đa 2000 ký tự'),
    paymentTerms: z
      .array(paymentTermSchema)
      .min(1, 'Cần ít nhất 1 đợt thanh toán'),
    bankIds: z.array(z.string()).min(1, 'Vui lòng chọn ít nhất 1 ngân hàng'),
    sellerSigned: z.boolean(),
    buyerSigned: z.boolean(),
    status: z.enum(CONTRACT_STATUSES, {
      error: 'Vui lòng chọn trạng thái hợp đồng',
    }),
  })
  .refine((values) => Boolean(values.sourceSellerId), {
    message: 'Vui lòng chọn bên bán, hoặc bấm "Thêm bên bán" để tạo mới',
    path: ['sourceSellerId'],
  })
  .refine((values) => Boolean(values.sourceCustomerId), {
    message: 'Vui lòng chọn khách hàng, hoặc bấm "Thêm khách hàng" để tạo mới',
    path: ['sourceCustomerId'],
  })
  .refine(
    (values) => {
      const total = values.paymentTerms.reduce(
        (sum, term) => sum + term.paymentRatioPercent,
        0,
      );
      return Math.abs(total - 100) < 0.01;
    },
    {
      message: 'Tổng tỷ lệ các đợt thanh toán phải bằng 100%',
      path: ['paymentTerms'],
    },
  )
  .refine(
    (values) =>
      !values.quotationDate ||
      !values.createdDate ||
      values.quotationDate <= values.createdDate,
    {
      // ISO date strings (YYYY-MM-DD) compare correctly with <= lexically.
      // Mirrors the backend's `QuotationDate <= CreatedDate` rule (see
      // `docs/api/Contracts.md`, BE-kt-xnk).
      message: 'Ngày báo giá phải trước hoặc bằng ngày tạo hợp đồng',
      path: ['quotationDate'],
    },
  )
  .refine(
    (values) =>
      requiresPlaceOfDischarge(values.incoterm)
        ? values.placeOfDischarge.length > 0
        : values.placeOfDischarge.length === 0,
    {
      // `ContractFormDialog` disables and clears `placeOfDischarge` for
      // FOB/EXW and requires it for DDP/CIF — this mirrors that rule
      // server-side-shaped so a stale value can't slip through if the UI
      // state and `incoterm` ever get out of sync (e.g. programmatic
      // submission, a bug in the clearing logic).
      message: 'Vui lòng chọn cảng/nơi đến',
      path: ['placeOfDischarge'],
    },
  );
