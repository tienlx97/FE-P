import { apiRequest } from '@/shared/api/api-client.js';

const GENERIC_LIST_ERROR = 'Không thể tải danh sách người dùng';
const GENERIC_DETAIL_ERROR = 'Không thể tải thông tin người dùng';
const GENERIC_UPDATE_ERROR = 'Không thể cập nhật người dùng';
const GENERIC_RESET_PASSWORD_ERROR = 'Không thể đặt lại mật khẩu';
const GENERIC_CONCURRENT_SESSIONS_ERROR =
  'Không thể cập nhật quyền đăng nhập đồng thời';
const GENERIC_GRANT_ADMIN_ERROR = 'Không thể cấp quyền Admin';
const GENERIC_REVOKE_ADMIN_ERROR = 'Không thể thu hồi quyền Admin';

/**
 * Admin-only. Returns one page — the endpoint is paginated and its rows are a
 * slim projection without identity-document or address fields
 * (see the API's `docs/security.md`, M-4). Use `getUser` for the full record.
 * @param {{ page?: number, pageSize?: number }} [options]
 * @returns {Promise<import('../types/index.js').UserListResult>}
 */
export async function listUsers({ page = 1, pageSize = 25 } = {}) {
  const result = await apiRequest(
    `/api/v1/users?page=${page}&pageSize=${pageSize}`,
    { errorMessage: GENERIC_LIST_ERROR },
  );

  if (!result.success) {
    return { success: false, message: result.message };
  }

  return {
    success: true,
    users: result.data?.items ?? [],
    page: result.data?.page ?? page,
    pageSize: result.data?.pageSize ?? pageSize,
    totalCount: result.data?.totalCount ?? 0,
    totalPages: result.data?.totalPages ?? 0,
  };
}

/**
 * Admin-only. The complete record for one user, including the fields the list
 * projection omits — the edit form needs them, and populating that form from a
 * list row would blank out whatever the row left out on the next save.
 * @param {string} userId
 * @returns {Promise<{ success: true, user: import('../types/index.js').UserDetail } | { success: false, message: string }>}
 */
export async function getUser(userId) {
  const result = await apiRequest(`/api/v1/users/${userId}`, {
    errorMessage: GENERIC_DETAIL_ERROR,
  });

  if (!result.success) {
    return { success: false, message: result.message };
  }

  return { success: true, user: result.data };
}

/**
 * Admin-only. Same field shape as `registerUser` minus `password`, plus
 * `nationalId` IS included and editable here — it stopped being the login
 * identifier (`EmployeeCode` is, and `PUT` never accepts that — it's
 * immutable) so it's just a normal correctable field now.
 * @param {string} userId
 * @param {import('../types/index.js').EditUserFormValues} values
 * @returns {Promise<import('../types/index.js').CreateUserResult>}
 */
export async function updateUser(userId, values) {
  const result = await apiRequest(`/api/v1/users/${userId}`, {
    method: 'PUT',
    errorMessage: GENERIC_UPDATE_ERROR,
    body: {
      FirstName: values.firstName,
      LastName: values.lastName,
      NationalId: values.nationalId,
      YearOfBirth: values.yearOfBirth,
      Gender: values.gender,
      NationalIdIssueDate: values.nationalIdIssueDate,
      NationalIdIssuePlace: values.nationalIdIssuePlace,
      PassportNumber: values.passportNumber || null,
      Phone: values.phone,
      OldProvince: values.oldProvince,
      OldDistrict: values.oldDistrict,
      OldWard: values.oldWard,
      OldAddressDetail: values.oldAddressDetail,
      NewProvince: values.newProvince,
      NewWard: values.newWard,
      NewAddressDetail: values.newAddressDetail,
      PositionId: values.positionId,
      CompanyId: values.companyId,
      BranchId: values.branchId,
      DepartmentId: values.departmentId,
    },
  });

  if (!result.success) {
    return { success: false, message: result.message };
  }

  return { success: true, id: result.data?.id };
}

/**
 * Admin-only. Sets the target user's password directly — no current-password
 * check, unlike `POST /users/me/password` (that one is self-service, this one
 * is for an Admin unblocking someone who forgot theirs). The response body is
 * empty; there is nowhere else to see the new password afterwards, so the
 * caller must hold onto `newPassword` and hand it to the employee.
 * @param {string} userId
 * @param {string} newPassword
 * @returns {Promise<{ success: true } | { success: false, message: string }>}
 */
export async function resetPassword(userId, newPassword) {
  const result = await apiRequest(`/api/v1/users/${userId}/password/reset`, {
    method: 'POST',
    errorMessage: GENERIC_RESET_PASSWORD_ERROR,
    body: { NewPassword: newPassword },
  });

  if (!result.success) {
    return { success: false, message: result.message };
  }

  return { success: true };
}

/**
 * Admin-only. Controls whether this account may keep more than one active
 * login. Turning the setting off revokes every session active at that moment.
 * @param {string} userId
 * @param {boolean} allowed
 * @returns {Promise<{ success: true } | { success: false, message: string }>}
 */
export async function setConcurrentSessions(userId, allowed) {
  const result = await apiRequest(
    `/api/v1/users/${userId}/concurrent-sessions`,
    {
      method: 'PUT',
      errorMessage: GENERIC_CONCURRENT_SESSIONS_ERROR,
      body: { Allowed: allowed },
    },
  );

  if (!result.success) {
    return { success: false, message: result.message };
  }

  return { success: true };
}

/**
 * Admin-only (BE-kt-xnk `[Authorize(Roles = "Admin")]` on the command —
 * only an existing Admin can promote someone else, never self-service; see
 * `UsersController.GrantAdminRole`'s doc comment, docs/security.md C-1).
 * Rotates the target's `SecurityStamp`, so it takes effect on their very
 * next request/token refresh.
 * @param {string} userId
 * @returns {Promise<{ success: true } | { success: false, message: string }>}
 */
export async function grantAdminRole(userId) {
  const result = await apiRequest(`/api/v1/users/${userId}/admin-role`, {
    method: 'POST',
    errorMessage: GENERIC_GRANT_ADMIN_ERROR,
  });

  if (!result.success) {
    return { success: false, message: result.message };
  }

  return { success: true };
}

/**
 * Admin-only. Also rotates the target's `SecurityStamp`.
 * @param {string} userId
 * @returns {Promise<{ success: true } | { success: false, message: string }>}
 */
export async function revokeAdminRole(userId) {
  const result = await apiRequest(`/api/v1/users/${userId}/admin-role`, {
    method: 'DELETE',
    errorMessage: GENERIC_REVOKE_ADMIN_ERROR,
  });

  if (!result.success) {
    return { success: false, message: result.message };
  }

  return { success: true };
}
