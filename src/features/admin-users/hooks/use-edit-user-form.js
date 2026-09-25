'use client';

import { useEffect, useRef, useState } from 'react';

import { userBankAccountEndpoint } from '@/shared/api/bank-accounts.js';

import { updateUserSchema } from '../config/update-user-schema.js';
import { useAdminBankAccountsQuery } from './use-admin-bank-accounts-query.js';
import {
  useBranchesQuery,
  useCompaniesQuery,
  useDepartmentsQuery,
  usePositionsQuery,
  useVietnamBanksQuery,
} from './use-org-directory.js';
import { useSetConcurrentSessionsMutation } from './use-set-concurrent-sessions-mutation.js';
import { useUpdateUserMutation } from './use-update-user-mutation.js';
import { useUserDetailQuery } from './use-user-detail-query.js';
import {
  resolveNewAddressLists,
  resolveOldAddressLists,
  useNewAddressQuery,
  useOldAddressQuery,
} from './use-vn-address.js';

/** @param {string} [message] @returns {{ type: 'error', message: string } | undefined} */
function fieldStatus(message) {
  return message ? { type: 'error', message } : undefined;
}

/**
 * Same cascade rules as `use-create-user-form.js`'s `applyFieldChange` —
 * see there for why.
 * @param {import('../types/index.js').EditUserFormValues} values
 * @param {keyof import('../types/index.js').EditUserFormValues} field
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

  return /** @type {import('../types/index.js').EditUserFormValues} */ (next);
}

/**
 * The form before the detail record arrives. Every field the API accepts must
 * appear here — a field missing from this object is one the form silently
 * cannot edit.
 * @type {import('../types/index.js').EditUserFormValues}
 */
const EMPTY_EDIT_VALUES = {
  firstName: '',
  lastName: '',
  nationalId: '',
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
};

/**
 * @param {import('../types/index.js').UserDetail} user
 * @returns {import('../types/index.js').EditUserFormValues}
 */
function toFormValues(user) {
  return {
    firstName: user.firstName,
    lastName: user.lastName,
    nationalId: user.nationalId,
    yearOfBirth: user.yearOfBirth ?? undefined,
    gender: user.gender ?? '',
    nationalIdIssueDate: user.nationalIdIssueDate ?? '',
    nationalIdIssuePlace: user.nationalIdIssuePlace ?? '',
    passportNumber: user.passportNumber ?? '',
    phone: user.phone ?? '',
    oldProvince: user.oldProvince ?? '',
    oldDistrict: user.oldDistrict ?? '',
    oldWard: user.oldWard ?? '',
    oldAddressDetail: user.oldAddressDetail ?? '',
    newProvince: user.newProvince ?? '',
    newWard: user.newWard ?? '',
    newAddressDetail: user.newAddressDetail ?? '',
    positionId: user.positionId ?? '',
    companyId: user.companyId ?? '',
    branchId: user.branchId ?? '',
    departmentId: user.departmentIds[0] ?? '',
  };
}

/**
 * @param {import('../types/index.js').UserListItem} user The list row that was
 *   clicked. Only its `id` is used — the form values come from the detail
 *   endpoint, because the row is a slim projection (see below).
 * @param {{ onSuccess?: () => void }} [options]
 */
export function useEditUserForm(user, { onSuccess } = {}) {
  // Starts blank rather than seeded from the list row. The row has no
  // passport number, CCCD issue date/place, year of birth or address
  // (docs/security.md, M-4), and `PUT` replaces everything — seeding from it
  // and saving before the detail arrives would erase those fields. The form
  // is gated on `isLoadingUser` until the real record lands.
  const [values, setValues] = useState(EMPTY_EDIT_VALUES);
  const [fieldErrors, setFieldErrors] = useState(
    /** @type {Record<string, string>} */ ({}),
  );
  const [submitError, setSubmitError] = useState('');
  const [submitSuccess, setSubmitSuccess] = useState('');
  const [allowConcurrentSessions, setAllowConcurrentSessions] = useState(false);
  const [concurrentSessionsStatus, setConcurrentSessionsStatus] = useState(
    /** @type {{ type: 'error' | 'success', message: string } | undefined} */ (
      undefined
    ),
  );

  const companiesQuery = useCompaniesQuery();
  const branchesQuery = useBranchesQuery(values.companyId);
  const departmentsQuery = useDepartmentsQuery();
  const positionsQuery = usePositionsQuery();
  const vietnamBanksQuery = useVietnamBanksQuery();
  const oldAddressQuery = useOldAddressQuery();
  const newAddressQuery = useNewAddressQuery();
  const bankAccountsQuery = useAdminBankAccountsQuery(user.id);
  const updateUserMutation = useUpdateUserMutation();
  const concurrentSessionsMutation = useSetConcurrentSessionsMutation();

  // The list row is a slim projection — it has no passport number, national-ID
  // issue date/place, year of birth or address (docs/security.md, M-4). Seeding
  // the form from it and saving would write those blanks back over the real
  // values, so the full record is fetched and the form re-seeded once it lands.
  const userDetailQuery = useUserDetailQuery(user.id);
  const hasSeededFromDetailRef = useRef(false);
  const [detailSeeded, setDetailSeeded] = useState(false);
  // Bank accounts are edited live in the shared panel, not on save.
  const isLoadingUser = !detailSeeded;
  const loadError =
    (userDetailQuery.data && !userDetailQuery.data.success
      ? userDetailQuery.data.message
      : '') ||
    (bankAccountsQuery.data && !bankAccountsQuery.data.success
      ? bankAccountsQuery.data.message
      : '') ||
    (userDetailQuery.isError || bankAccountsQuery.isError
      ? 'Không thể tải đầy đủ thông tin người dùng.'
      : '');

  useEffect(() => {
    if (hasSeededFromDetailRef.current || !userDetailQuery.data?.success)
      return;

    setValues(toFormValues(userDetailQuery.data.user));
    setAllowConcurrentSessions(
      userDetailQuery.data.user.allowConcurrentSessions,
    );
    hasSeededFromDetailRef.current = true;
    setDetailSeeded(true);
  }, [userDetailQuery.data]);

  /** @param {boolean} allowed */
  async function handleConcurrentSessionsChange(allowed) {
    setConcurrentSessionsStatus(undefined);

    const result = await concurrentSessionsMutation.mutateAsync({
      userId: user.id,
      allowed,
    });

    if (!result.success) {
      setConcurrentSessionsStatus({
        type: 'error',
        message: result.message,
      });
      return;
    }

    setAllowConcurrentSessions(allowed);
    setConcurrentSessionsStatus({
      type: 'success',
      message: allowed
        ? 'Đã cho phép tài khoản đăng nhập đồng thời trên nhiều thiết bị.'
        : 'Đã giới hạn đăng nhập một nơi và thu hồi tất cả phiên hiện tại.',
    });
  }

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
    setValues((current) =>
      applyFieldChange(
        current,
        /** @type {keyof import('../types/index.js').EditUserFormValues} */ (
          field
        ),
        value,
      ),
    );
  }

  /** @param {import('react').FormEvent<HTMLFormElement>} event */
  async function handleSubmit(event) {
    event.preventDefault();
    if (isLoadingUser) return;
    setSubmitError('');
    setSubmitSuccess('');

    const result = updateUserSchema.safeParse(values);
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
    const updateResult = await updateUserMutation.mutateAsync({
      userId: user.id,
      values: result.data,
    });

    if (!updateResult.success) {
      setSubmitError(updateResult.message ?? 'Cập nhật người dùng thất bại');
      return;
    }

    onSuccess?.();
  }

  return {
    values,
    setField,
    isLoadingUser,
    loadError,
    retryLoad: () => {
      userDetailQuery.refetch();
      bankAccountsQuery.refetch();
    },
    fieldStatuses: {
      firstName: fieldStatus(fieldErrors.firstName),
      lastName: fieldStatus(fieldErrors.lastName),
      nationalId: fieldStatus(fieldErrors.nationalId),
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
    isSubmitting: updateUserMutation.isPending,
    companies: companiesQuery.data ?? [],
    branches: branchesQuery.data ?? [],
    departments: departmentsInBranch,
    positions: positionsQuery.data ?? [],
    vietnamBanks: vietnamBanksQuery.data ?? [],
    oldProvinces,
    oldDistricts,
    oldWards,
    newProvinces,
    newWards,
    bankAccountsPanelProps: {
      accounts: bankAccountsQuery.data?.success
        ? bankAccountsQuery.data.bankAccounts
        : [],
      endpoint: userBankAccountEndpoint(user.id),
      onChanged: () => {
        bankAccountsQuery.refetch();
      },
      holderDefault: `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim(),
    },
    extraPermissions: userDetailQuery.data?.success
      ? userDetailQuery.data.user.extraPermissions
      : [],
    concurrentSessionsProps: {
      allowed: allowConcurrentSessions,
      isUpdating: concurrentSessionsMutation.isPending,
      status: concurrentSessionsStatus,
      onChange: handleConcurrentSessionsChange,
    },
    handleSubmit,
  };
}
