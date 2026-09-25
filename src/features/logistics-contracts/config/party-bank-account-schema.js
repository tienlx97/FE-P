import { z } from 'zod';

/**
 * One partner bank account — mirrors BE-kt-xnk
 * `PartyBankAccountInputValidator`.
 */
export const partyBankAccountSchema = z.object({
  bankName: z.string().trim().min(1, 'Vui lòng chọn ngân hàng').max(200),
  branch: z.string().trim().max(200),
  province: z.string().trim().max(200),
  accountNumber: z
    .string()
    .trim()
    .min(1, 'Vui lòng nhập số tài khoản')
    .max(100),
  holder: z.string().trim().max(200),
  currency: z
    .string()
    .trim()
    .regex(/^[A-Za-z]{3}$/, 'Mã tiền tệ gồm 3 chữ cái'),
  swiftCode: z.union([
    z.literal(''),
    z
      .string()
      .trim()
      .regex(/^[A-Za-z0-9]{8}([A-Za-z0-9]{3})?$/, 'SWIFT gồm 8 hoặc 11 ký tự'),
  ]),
  isActive: z.boolean(),
  isDefault: z.boolean(),
  // "Thêm trường" — IBAN, routing number… (BE max 20, key ≤100, value ≤2000).
  extraFields: z
    .array(
      z.object({
        key: z.string().trim().min(1, 'Nhập tên trường').max(100),
        value: z.string().max(2000),
      }),
    )
    .max(20, 'Tối đa 20 trường bổ sung'),
});

/**
 * Quick-add names for a foreign bank's usual parameters (the "Thêm trường"
 * suggestions in `SupplierBankAccountDialog`).
 */
export const FOREIGN_BANK_FIELD_SUGGESTIONS = [
  'IBAN',
  'Routing / ABA',
  'Sort code',
  'BSB',
  'Địa chỉ ngân hàng',
  'Ngân hàng trung gian',
];
