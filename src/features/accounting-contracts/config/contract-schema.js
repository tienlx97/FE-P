import { z } from 'zod';

/** Mirrors BE-P `AccountingContractInputValidator`. */
export const contractSchema = z.object({
  companyId: z.string().min(1, 'Vui lòng chọn công ty'),
  contractNumber: z
    .string()
    .trim()
    .min(1, 'Vui lòng nhập số hợp đồng')
    .max(100, 'Tối đa 100 ký tự'),
  signedDate: z.string().min(1, 'Vui lòng chọn ngày ký'),
  projectCode: z
    .string()
    .trim()
    .min(1, 'Vui lòng nhập mã công trình')
    .max(100, 'Tối đa 100 ký tự'),
  projectName: z
    .string()
    .trim()
    .min(1, 'Vui lòng nhập tên dự án')
    .max(300, 'Tối đa 300 ký tự'),
  sourceId: z.string(),
  customerId: z.string().min(1, 'Vui lòng chọn khách hàng'),
  valueBeforeTax: z
    .number({ error: 'Vui lòng nhập giá trị hợp đồng' })
    .nonnegative('Không được âm'),
  taxRatePercent: z
    .number({ error: 'Vui lòng nhập thuế' })
    .min(0, 'Từ 0 đến 100')
    .max(100, 'Từ 0 đến 100'),
  valueAfterTax: z.number().nonnegative('Không được âm').optional(),
  paymentDueDate: z.string(),
  note: z.string().max(2000, 'Tối đa 2000 ký tự'),
});

/** Common rates offered as shortcuts; any other rate can still be typed. */
export const TAX_RATE_SHORTCUTS = [8, 10];
