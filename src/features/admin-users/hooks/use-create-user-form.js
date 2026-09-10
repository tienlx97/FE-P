'use client';

import { useState } from 'react';

import { adminAddBankAccount } from '../api/bank-accounts.js';
import { createUserSchema } from '../config/create-user-schema.js';
import { useBankAccountRows } from './use-bank-account-rows.js';
import { useCreateUserMutation } from './use-create-user-mutation.js';
import { useGrantablePermissionsQuery } from './use-grantable-permissions-query.js';
import { useInheritedPermissionsQuery } from './use-inherited-permissions-query.js';
import {
  useBranchesQuery,
  useCompaniesQuery,
  useDepartmentsQuery,
  usePositionsQuery,
  useVietnamBanksQuery,
} from './use-org-directory.js';
import {
  resolveNewAddressLists,
  resolveOldAddressLists,
  useNewAddressQuery,
  useOldAddressQuery,
} from './use-vn-address.js';

/** @type {import('../types/index.js').CreateUserFormValues} */
const EMPTY_VALUES = {
  nationalId: '',
  firstName: '',
  lastName: '',
  password: '',
  yearOfBirth: undefined,
  gender: '',
  nationalIdIssueDate: '',
  nationalIdIssuePlace: '',
  passportNumber: '',
  phone: '',
  oldProvince: '',
  oldDistrict: '',
  oldWard: '',
  oldAddressDetail: '',
  newProvince: '',
  newWard: '',
  newAddressDetail: '',
  positionId: '',
  companyId: '',
  branchId: '',
  departmentId: '',
  extraPermissions: [],
};

/** @param {string} [message] @returns {{ type: 'error', message: string } | undefined} */
function fieldStatus(message) {
  return message ? { type: 'error', message } : undefined;
}

/**
 * Company → Branch → Department is a cascade: picking a new Company clears
 * the (now stale) Branch and Department, and picking a new Branch clears
 * the (now stale) Department. The old-address (Province → District → Ward)
 * and new-address (Province → Ward) cascades work the same way,
 * independently of each other — both are captured at once, see
 * `user-contact-fields.jsx`.
 * @param {import('../types/index.js').CreateUserFormValues} values
 * @param {keyof import('../types/index.js').CreateUserFormValues} field
 * @param {string | number | undefined} value
 */
function applyFieldChange(values, field, value) {
  const next = { ...values, [field]: value };

  if (field === 'companyId') {
    next.branchId = '';
    next.departmentId = '';
  }
  if (field === 'branchId') {
    next.departmentId = '';
  }
  if (field === 'oldProvince') {
    next.oldDistrict = '';
    next.oldWard = '';
  }
  if (field === 'oldDistrict') {
    next.oldWard = '';
  }
  if (field === 'newProvince') {
    next.newWard = '';
  }

  return /** @type {import('../types/index.js').CreateUserFormValues} */ (next);
}

/**
 * Persists every row that has both a bank and an account number (empty
 * rows the user added but never filled in are silently dropped, not an
 * error). Sent sequentially, not in parallel: the first one saved becomes
 * primary regardless of the row's local `isPrimary` flag (same "first
 * account is always primary" rule as the self-service API), so row order
 * must be preserved.
 * @param {string} userId
 * @param {import('../types/index.js').BankAccountRow[]} rows
 * @returns {Promise<string[]>} human-readable messages for rows that failed to save
 */
async function addFilledBankAccountRows(userId, rows) {
  /** @type {string[]} */
  const failures = [];

  for (const row of rows) {
    if (!row.vietnamBankId || !row.accountNumber.trim()) continue;

    const result = await adminAddBankAccount(userId, row);
    if (!result.success) {
      failures.push(`${row.accountNumber}: ${result.message}`);
    }
  }

  return failures;
}

/** @param {{ onSuccess?: () => void }} [options] */
export function useCreateUserForm({ onSuccess } = {}) {
  const [values, setValues] = useState(EMPTY_VALUES);
  const [fieldErrors, setFieldErrors] = useState(
    /** @type {Record<string, string>} */ ({}),
  );
  const [submitError, setSubmitError] = useState('');
  const [submitSuccess, setSubmitSuccess] = useState('');

  const companiesQuery = useCompaniesQuery();
  const branchesQuery = useBranchesQuery(values.companyId);
  const departmentsQuery = useDepartmentsQuery();
  const positionsQuery = usePositionsQuery();
  const vietnamBanksQuery = useVietnamBanksQuery();
  const oldAddressQuery = useOldAddressQuery();
  const newAddressQuery = useNewAddressQuery();
  const createUserMutation = useCreateUserMutation();
  const grantablePermissionsQuery = useGrantablePermissionsQuery();
  const inheritedPermissionsQuery = useInheritedPermissionsQuery(values.departmentId);
  const bankAccountRows = useBankAccountRows();

  const departmentsInBranch = (departmentsQuery.data ?? []).filter(
    (department) => department.branchId === values.branchId,
  );
  const {
    provinces: oldProvinces,
    districts: oldDistricts,
    wards: oldWards,
  } = resolveOldAddressLists(values, oldAddressQuery.data);
  const { provinces: newProvinces, wards: newWards } = resolveNewAddressLists(
    values,
    newAddressQuery.data,
  );

  /**
   * @param {string} field
   * @param {string | number | undefined} value
   */
  function setField(field, value) {
    if (field === 'companyId' || field === 'branchId' || field === 'departmentId') {
      setValues((current) => ({ ...current, extraPermissions: [] }));
    }

    setValues((current) =>
      applyFieldChange(
        current,
        /** @type {keyof import('../types/index.js').CreateUserFormValues} */ (
          field
        ),
        value,
      ),
    );
  }

  /** @param {string[]} permissions */
  function setExtraPermissions(permissions) {
    setValues((current) => ({ ...current, extraPermissions: permissions }));
  }

  /** @param {import('react').FormEvent<HTMLFormElement>} event */
  async function handleSubmit(event) {
    event.preventDefault();
    setSubmitError('');
    setSubmitSuccess('');

    const result = createUserSchema.safeParse(values);
    if (!result.success) {
      /** @type {Record<string, string>} */
      const nextFieldErrors = {};
      for (const issue of result.error.issues) {
        const key = String(issue.path[0]);
        if (!nextFieldErrors[key]) {
          nextFieldErrors[key] = issue.message;
        }
      }
      setFieldErrors(nextFieldErrors);
      return;
    }

    setFieldErrors({});
    const createResult = await createUserMutation.mutateAsync(result.data);

    if (!createResult.success) {
      setSubmitError(createResult.message ?? 'Tạo người dùng thất bại');
      return;
    }

    const bankAccountFailures = await addFilledBankAccountRows(
      createResult.id,
      bankAccountRows.rows,
    );

    // The Admin must hand both of these to the new employee to log in. The
    // employee code is still visible later via the edit form, but the
    // password is not — the server never returns it, so this banner is the
    // only place it will ever be visible again.
    const employeeCodeNote = createResult.employeeCode
      ? ` Mã nhân viên để đăng nhập: ${createResult.employeeCode}.`
      : '';
    const passwordNote = ` Mật khẩu: ${result.data.password}.`;

    setSubmitSuccess(
      (bankAccountFailures.length === 0
        ? 'Đã tạo người dùng thành công.'
        : `Đã tạo người dùng thành công, nhưng ${bankAccountFailures.length} tài khoản ngân hàng lưu thất bại: ${bankAccountFailures.join('; ')}`) +
        employeeCodeNote +
        passwordNote,
    );
    setValues(EMPTY_VALUES);
    bankAccountRows.clearRows();
    onSuccess?.();
  }

  return {
    values,
    setField,
    fieldStatuses: {
      nationalId: fieldStatus(fieldErrors.nationalId),
      firstName: fieldStatus(fieldErrors.firstName),
      lastName: fieldStatus(fieldErrors.lastName),
      password: fieldStatus(fieldErrors.password),
      yearOfBirth: fieldStatus(fieldErrors.yearOfBirth),
      gender: fieldStatus(fieldErrors.gender),
      nationalIdIssueDate: fieldStatus(fieldErrors.nationalIdIssueDate),
      nationalIdIssuePlace: fieldStatus(fieldErrors.nationalIdIssuePlace),
      passportNumber: fieldStatus(fieldErrors.passportNumber),
      phone: fieldStatus(fieldErrors.phone),
      oldProvince: fieldStatus(fieldErrors.oldProvince),
      oldDistrict: fieldStatus(fieldErrors.oldDistrict),
      oldWard: fieldStatus(fieldErrors.oldWard),
      oldAddressDetail: fieldStatus(fieldErrors.oldAddressDetail),
      newProvince: fieldStatus(fieldErrors.newProvince),
      newWard: fieldStatus(fieldErrors.newWard),
      newAddressDetail: fieldStatus(fieldErrors.newAddressDetail),
      positionId: fieldStatus(fieldErrors.positionId),
      companyId: fieldStatus(fieldErrors.companyId),
      branchId: fieldStatus(fieldErrors.branchId),
      departmentId: fieldStatus(fieldErrors.departmentId),
    },
    submitError,
    submitSuccess,
    isSubmitting: createUserMutation.isPending,
    companies: companiesQuery.data ?? [],
    branches: branchesQuery.data ?? [],
    departments: departmentsInBranch,
    positions: positionsQuery.data ?? [],
    inheritedPermissions: inheritedPermissionsQuery.data ?? [],
    grantablePermissions: grantablePermissionsQuery.data ?? [],
    isLoadingPermissions:
      inheritedPermissionsQuery.isLoading || grantablePermissionsQuery.isLoading,
    setExtraPermissions,
    vietnamBanks: vietnamBanksQuery.data ?? [],
    oldProvinces,
    oldDistricts,
    oldWards,
    newProvinces,
    newWards,
    bankAccountRows: bankAccountRows.rows,
    addBankAccountRow: bankAccountRows.addRow,
    removeBankAccountRow: bankAccountRows.removeRow,
    clearBankAccountRows: bankAccountRows.clearRows,
    updateBankAccountRowField: bankAccountRows.updateRowField,
    setPrimaryBankAccountRow: bankAccountRows.setPrimaryRow,
    handleSubmit,
  };
}
