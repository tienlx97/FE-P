import { z } from 'zod';

export const loginSchema = z.object({
  // CCCD (12 digits) — the login identifier. See BE-kt-xnk
  // `docs/api/Authentication.md`.
  nationalId: z
    .string()
    .trim()
    .min(1, 'Vui lòng nhập số CCCD'),
  // Password format/strength is enforced by the backend; the client only
  // checks that something was typed.
  password: z.string().min(1, 'Vui lòng nhập mật khẩu'),
  rememberMe: z.boolean(),
});
