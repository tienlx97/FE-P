'use client';

import { useCreateUserForm } from './use-create-user-form.js';

/**
 * Create-user half of the v2 dialog's contract. All the real work (state,
 * cascades, validation, mutations, bank-account persistence) still lives in
 * `use-create-user-form.js` — v1 and v2 differ only in how the fields are
 * laid out, so duplicating that logic here would just create two copies to
 * keep in sync. This wrapper adds the mode-specific bits the shared dialog
 * needs (`user-form-dialog.jsx`).
 * @param {{ onSuccess?: () => void }} [options]
 * @returns {import('../types/index.js').UserFormV2Controller}
 */
export function useCreateUserFormV2({ onSuccess } = {}) {
  const form = useCreateUserForm({ onSuccess });

  return {
    ...form,
    mode: 'create',
    title: 'TẠO NGƯỜI DÙNG',
    submitLabel: 'Tạo người dùng',
    // Nothing to fetch before the form is usable — the create form starts blank.
    isLoadingUser: false,
    password: form.values.password,
    editableNationalId: form.values.nationalId,
    // Doesn't exist until the account is actually created — the generated
    // code surfaces in `submitSuccess` instead once it does.
    readOnlyEmployeeCode: null,
    permissionsFieldsProps: null,
    createPermissionsFieldsProps: {
      inheritedPermissions: form.inheritedPermissions,
      grantablePermissions: form.grantablePermissions,
      selectedPermissions: form.values.extraPermissions,
      isLoading: form.isLoadingPermissions,
      error: form.permissionsError,
      hasDepartment: Boolean(form.values.departmentId),
      onChange: form.setExtraPermissions,
    },
    concurrentSessionsProps: null,
  };
}
