/**
 * Vietnamese display labels for permissions from `GET /permissions/grantable`
 * — a **curated local fallback**, not the source of which permissions
 * exist (that's the backend's `GrantablePermission` catalog, fetched at
 * runtime; see
 * `openspec/changes/add-create-grantable-permission/proposal.md`). A
 * permission not listed here still renders — see `labelForPermission`.
 * @type {Record<string, { label: string, description?: string }>}
 */
export const PERMISSION_LABELS = {
  'logistics:view': { label: 'Xem Logistics' },
  'logistics:manage': { label: 'Quản lý Logistics' },
  'logistics:contracts:view': { label: 'Xem hợp đồng' },
  'logistics:contracts:manage': { label: 'Quản lý hợp đồng' },
  'logistics:secret': {
    label: 'Dữ liệu mật Logistics',
    description:
      'Dành cho trưởng phòng hoặc 1 nhân viên được chỉ định riêng — độc lập với phòng ban.',
  },
};

/** @param {string} scopeType */
export function labelForPermissionScope(scopeType) {
  return (
    {
      company: 'Phạm vi công ty',
      branch: 'Phạm vi chi nhánh',
      global: 'Toàn hệ thống',
    }[scopeType] ?? 'Phạm vi chưa xác định'
  );
}

/**
 * Preference order: a curated `PERMISSION_LABELS` entry (nicest — reviewed
 * copy) beats the backend's `description` (Admin-authored free text at
 * creation time — works for anything, including a permission created
 * through the API that this map has never heard of) beats the raw key
 * (never disappears, even with no description either).
 * @param {string} permission
 * @param {string | null} [apiDescription] `description` from
 *   `GET /permissions/grantable` for this permission.
 * @returns {{ label: string, description?: string }}
 */
export function labelForPermission(permission, apiDescription) {
  const curated = PERMISSION_LABELS[permission];
  if (curated)
    return {
      ...curated,
      description: curated.description ?? apiDescription ?? undefined,
    };

  return apiDescription
    ? { label: permission, description: apiDescription }
    : { label: permission };
}

/**
 * Mirrors the backend's `CreateGrantablePermissionCommandValidator` so a
 * typo is caught before the round trip. The backend stays the authority —
 * this only saves a 400, it does not decide anything.
 */
const PERMISSION_KEY_PATTERN = /^[a-z0-9]+(:[a-z0-9]+)+$/;

/**
 * @param {string} key
 * @returns {string} empty when valid, else the Vietnamese reason.
 */
export function validatePermissionKey(key) {
  if (!key.trim()) return 'Vui lòng nhập mã quyền';

  if (!PERMISSION_KEY_PATTERN.test(key)) {
    return 'Mã quyền phải dạng nhom:hanh-dong, chữ thường không dấu (vd: sales:secret)';
  }

  if (key.length > 100) return 'Mã quyền tối đa 100 ký tự';

  return '';
}
