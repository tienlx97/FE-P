import { z } from 'zod';

/**
 * Mirrors the backend's `CreateCustomerCommandValidator` (BE-kt-xnk) —
 * `CompanyName` is the only required field.
 */
export const customerSchema = z.object({
  companyName: z.string().trim().min(1, 'Vui lòng nhập tên công ty'),
  code: z.string().trim().min(1, 'Vui lòng nhập mã đối tác').max(50),
  isOrganization: z.boolean(),
  taxCode: z.string().trim().max(50),
  budgetUnitCode: z.string().trim().max(50),
  phone: z.string().trim().max(50),
  website: z.string().trim().max(500),
  groupId: z.string(),
  employeeId: z.string(),
  isInternal: z.boolean(),
  representativeName: z.string().trim(),
  representativeTitle: z.string().trim(),
  address: z.string().trim(),
  contactSalutation: z.string().trim().max(50),
  contactName: z.string().trim().max(200),
  contactEmail: z.union([z.literal(''), z.email('Email liên hệ không hợp lệ')]),
  contactPhone: z.string().trim().max(50),
  invoiceRecipientName: z.string().trim().max(200),
  invoiceRecipientEmails: z
    .string()
    .trim()
    .refine(
      (value) =>
        !value ||
        value
          .split(';')
          .every((email) => z.email().safeParse(email.trim()).success),
      'Các email hóa đơn phải hợp lệ và ngăn cách bằng dấu ;',
    ),
  invoiceRecipientPhone: z.string().trim().max(50),
  paymentTermId: z.string(),
  dueDays: z.number().int().min(0).optional(),
  creditLimit: z.number().min(0).optional(),
  debtAccount: z.string().trim().max(50),
  country: z.string().trim().max(200),
  province: z.string().trim().max(200),
  district: z.string().trim().max(200),
  ward: z.string().trim().max(200),
  deliveryAddressSameAsMain: z.boolean(),
  notes: z.string().trim().max(4000),
});
