import { apiRequest } from '@/shared/api/api-client.js';

const GENERIC_LIST_ERROR = 'Không thể tải danh sách quyền có thể cấp';
const GENERIC_GRANT_ERROR = 'Không thể cấp quyền';
const GENERIC_REVOKE_ERROR = 'Không thể thu hồi quyền';

/**
 * Admin-only. The `GrantablePermission` catalog — the whitelist a
 * permission must be on before `grantUserPermission` will accept it.
 * Backend-owned (a DB table, not a compile-time list), so Admin can add a
 * new entry via `createGrantablePermission` without a code change/deploy
 * (see `openspec/changes/add-create-grantable-permission/proposal.md`).
 * `description` is whatever Admin wrote when creating the permission —
 * used as a label fallback when the FE has no curated one.
 * @returns {Promise<{ key: string, description: string | null }[]>}
 */
export async function listGrantablePermissions() {
  const result = await apiRequest('/api/v1/permissions/grantable', {
    errorMessage: GENERIC_LIST_ERROR,
  });

  if (!result.success) throw new Error(result.message);
  return result.data ?? [];
}

/**
 * Admin-only preview of permissions inherited from the selected department.
 * The backend owns role-to-permission mapping and branch scope; the FE must
 * never duplicate that authorization policy.
 * @param {string} departmentId
 * @returns {Promise<import('../types/index.js').InheritedPermission[]>}
 */
export async function previewInheritedPermissions(departmentId) {
  const result = await apiRequest(
    `/api/v1/permissions/inherited?departmentId=${encodeURIComponent(departmentId)}`,
    { errorMessage: 'Không thể tải quyền kế thừa' },
  );

  if (!result.success) throw new Error(result.message);
  return result.data ?? [];
}

/**
 * Admin-only. Adds a permission to the grantable catalog. `key` must match
 * `namespace:action`, lowercase (e.g. `sales:secret`) — rejected (400)
 * otherwise. Does not, by itself, make any endpoint enforce it — a
 * business endpoint still needs its own `[Authorize(Permissions = ...)]`
 * on the backend.
 * @param {string} key
 * @param {string} [description]
 * @returns {Promise<{ success: true } | { success: false, message: string }>}
 */
export async function createGrantablePermission(key, description) {
  const result = await apiRequest('/api/v1/permissions/grantable', {
    method: 'POST',
    errorMessage: 'Không thể thêm permission mới',
    body: { Key: key, Description: description || null },
  });

  if (!result.success) {
    return { success: false, message: result.message };
  }

  return { success: true };
}

/**
 * Admin-only. Grants one permission directly to a user, independent of
 * their role/department — rejected (400) if `permission` is not in the
 * backend's `GrantablePermission` catalog (a DB table since
 * `add-create-grantable-permission`, not the old static array). Rotates the
 * target's `SecurityStamp`, so it takes effect on their very next request.
 * @param {string} userId
 * @param {string} permission
 * @returns {Promise<{ success: true } | { success: false, message: string }>}
 */
export async function grantUserPermission(userId, permission) {
  const result = await apiRequest(`/api/v1/users/${userId}/permissions`, {
    method: 'POST',
    errorMessage: GENERIC_GRANT_ERROR,
    body: { Permission: permission },
  });

  if (!result.success) {
    return { success: false, message: result.message };
  }

  return { success: true };
}

/**
 * Admin-only. Also rotates the target's `SecurityStamp`.
 * @param {string} userId
 * @param {string} permission
 * @returns {Promise<{ success: true } | { success: false, message: string }>}
 */
export async function revokeUserPermission(userId, permission) {
  const result = await apiRequest(
    `/api/v1/users/${userId}/permissions/${encodeURIComponent(permission)}`,
    { method: 'DELETE', errorMessage: GENERIC_REVOKE_ERROR },
  );

  if (!result.success) {
    return { success: false, message: result.message };
  }

  return { success: true };
}
