import { apiRequest } from '@/shared/api/api-client.js';

const GENERIC_ERROR_MESSAGE = 'Không thể đổi mật khẩu';

/**
 * Self-service password change — `POST /api/v1/users/me/password` (see
 * `docs/api/Users.md`, BE-kt-xnk). The backend identifies the user from the
 * bearer token, so no `userId` is sent; unlike Admin's `resetPassword`
 * (`admin-users/api/users.js`), this requires the caller's current password.
 * @param {string} currentPassword
 * @param {string} newPassword
 * @returns {Promise<{ success: true } | { success: false, message: string }>}
 */
export async function changePassword(currentPassword, newPassword) {
  const result = await apiRequest('/api/v1/users/me/password', {
    method: 'POST',
    errorMessage: GENERIC_ERROR_MESSAGE,
    body: { CurrentPassword: currentPassword, NewPassword: newPassword },
  });

  if (!result.success) {
    return { success: false, message: result.message };
  }

  return { success: true };
}
