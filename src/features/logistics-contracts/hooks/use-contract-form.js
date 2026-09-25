'use client';

import { useState } from 'react';

import { generateRowKey } from '@/shared/config/generate-row-key.js';
import { useExtraFieldRows } from '@/shared/hooks/use-extra-field-rows.js';

import { contractSchema } from '../config/contract-schema.js';
import { CONTRACT_STATUSES } from '../config/contract-status.js';
import { CONTRACT_TYPES } from '../config/contract-types.js';
import { DEFAULT_CURRENCY } from '../config/currencies.js';
import { requiresPlaceOfDelivery } from '../config/incoterms.js';
import { findVietnamCountry } from '../config/vietnam-country.js';
import { useContractNumberExistsQuery } from './use-contract-number-exists-query.js';
import {
  useCreateContractMutation,
  useUpdateContractMutation,
} from './use-contracts-query.js';
import { useCountriesQuery } from './use-countries-query.js';
import { useCustomersQuery } from './use-customers-query.js';
import { useDeliveryPlacesQuery } from './use-delivery-places-query.js';
import { useCompaniesQuery } from './use-org-directory.js';
import { usePaymentTermRows } from './use-payment-term-rows.js';
import { usePortsQuery } from './use-ports-query.js';
import {
  useChangeSellerBankAccount,
  useSellersQuery,
} from './use-sellers-query.js';

const TODAY_ISO = new Date().toISOString().slice(0, 10);
// Every contract to date has used the Incoterms 2010 rulebook — default to
// it rather than the current year so the field doesn't drift year over year
// while the business is still on the 2010 edition.
const DEFAULT_INCOTERM_YEAR = 2010;
// Every contract to date has been steel-structure work — default the field
// instead of making every user retype the same value (still freely editable
// for the day a different category shows up).
const DEFAULT_CATEGORY = 'STEEL STRUCTURE';

/**
 * One option of the contract's place pickers. `placeOfLoading` /
 * `placeOfDischarge` / `placeOfDelivery` are plain strings on the wire, so
 * the Selectors key options by the text they save (`name`), not an id.
 * @typedef {{ id: string, name: string, label: string }} PlaceOption
 */

/**
 * A port saves its long name when it has one ("Cảng Cát Lái, TP. Hồ Chí
 * Minh"), else its short name; the option shows "Short name (UN/LOCODE)".
 * @param {import('../types/index.js').Port} port
 * @returns {PlaceOption}
 */
function portOption(port) {
  return {
    id: port.id,
    name: port.fullName || port.name,
    label: `${port.name} (${port.code})`,
  };
}

/**
 * @param {import('../types/index.js').DeliveryPlace} place
 * @returns {PlaceOption}
 */
function deliveryPlaceOption(place) {
  return { id: place.id, name: place.name, label: place.name };
}

/**
 * Collapses options that would save the same text (first wins) — two
 * catalog rows can share a name, which would otherwise surface as a "two
 * children with the same key" React warning in the Selector's option list.
 * @param {PlaceOption[]} options
 * @returns {PlaceOption[]}
 */
function dedupePlacesByName(options) {
  const seen = new Set();
  return options.filter((option) => {
    if (seen.has(option.name)) return false;
    seen.add(option.name);
    return true;
  });
}

/** @returns {import('../types/index.js').ContractFormValues} */
function emptyValues() {
  return {
    contractNumber: '',
    // New contracts default to Draft — the user promotes to Official once
    // it's finalized (edit form still lets it be changed either way).
    contractType: CONTRACT_TYPES[0],
    createdDate: TODAY_ISO,
    quotationDate: TODAY_ISO,
    projectCompletionDate: '',
    projectName: '',
    category: DEFAULT_CATEGORY,
    countryId: '',
    placeOfLoading: '',
    placeOfDischarge: '',
    placeOfDelivery: '',
    contractValue: undefined,
    currency: DEFAULT_CURRENCY,
    incoterm: '',
    incotermYear: DEFAULT_INCOTERM_YEAR,
    companyId: '',
    sourceSellerId: '',
    sellerInline: {
      companyName: '',
      representativeName: '',
      representativeTitle: '',
      address: '',
    },
    sourceCustomerId: '',
    buyerInline: {
      companyName: '',
      representativeName: '',
      representativeTitle: '',
      address: '',
    },
    note: '',
    bankIds: [],
    sellerSigned: false,
    buyerSigned: false,
    // New contracts default to "Đang thực hiện" (in-progress) — matches
    // the backend's own default (BE-kt-xnk).
    status: CONTRACT_STATUSES[0],
  };
}

/**
 * @param {import('../types/index.js').Contract} contract
 * @returns {import('../types/index.js').ContractFormValues}
 */
function valuesFromContract(contract) {
  return {
    contractNumber: contract.contractNumber,
    contractType: contract.contractType,
    createdDate: contract.createdDate,
    quotationDate: contract.quotationDate,
    projectCompletionDate: contract.projectCompletionDate ?? '',
    projectName: contract.projectName,
    category: contract.category,
    countryId: contract.countryId,
    placeOfLoading: contract.placeOfLoading,
    // Older EXW/FOB contracts were saved without a destination port (it's
    // required for every Incoterm now) and non-DDP contracts have no
    // delivery place — normalize nulls like every other nullable snapshot
    // field here, or the schema's refines throw calling .length on null.
    placeOfDischarge: contract.placeOfDischarge ?? '',
    placeOfDelivery: contract.placeOfDelivery ?? '',
    contractValue: contract.contractValue,
    currency: contract.currency,
    incoterm: contract.incoterm,
    incotermYear: contract.incotermYear,
    // Company is fixed after creation (the backend never accepts a changed
    // CompanyId on update) — still loaded here so the disabled Selector in
    // edit mode can display it.
    companyId: contract.companyId,
    sourceSellerId: contract.seller.sourceSellerId ?? '',
    // RepresentativeName/RepresentativeTitle/Address are per-contract even
    // when linked to a source seller (only CompanyName is pinned to the
    // catalog) — always load the contract's own stored values, never blank
    // them out based on sourceSellerId.
    sellerInline: {
      companyName: contract.seller.sourceSellerId
        ? ''
        : contract.seller.companyName,
      representativeName: contract.seller.representativeName ?? '',
      representativeTitle: contract.seller.representativeTitle ?? '',
      address: contract.seller.address ?? '',
    },
    sourceCustomerId: contract.buyer.sourceCustomerId ?? '',
    // RepresentativeName/RepresentativeTitle/Address are per-contract even
    // when linked to a source customer (only CompanyName is pinned to the
    // catalog) — always load the contract's own stored values, never blank
    // them out based on sourceCustomerId.
    buyerInline: {
      companyName: contract.buyer.sourceCustomerId
        ? ''
        : contract.buyer.companyName,
      representativeName: contract.buyer.representativeName ?? '',
      representativeTitle: contract.buyer.representativeTitle ?? '',
      address: contract.buyer.address ?? '',
    },
    note: contract.note ?? '',
    bankIds: contract.bankIds,
    sellerSigned: contract.sellerSigned,
    buyerSigned: contract.buyerSigned,
    status: contract.status,
  };
}

/** @param {string} [message] @returns {{ type: 'error', message: string } | undefined} */
function fieldStatus(message) {
  return message ? { type: 'error', message } : undefined;
}

/**
 * Single hook backing both the create and edit Contract dialog — there is
 * no legacy version of this form to keep separate (unlike admin-users'
 * v1/v2 split), so one mode-aware hook is simplest.
 * @param {{ contract?: import('../types/index.js').Contract | null, onSuccess?: (contract: import('../types/index.js').Contract) => void }} [options]
 */
export function useContractForm({ contract = null, onSuccess } = {}) {
  const isEdit = Boolean(contract);

  const [version, setVersion] = useState(contract?.version);
  const [values, setValues] = useState(
    contract ? valuesFromContract(contract) : emptyValues(),
  );
  const [fieldErrors, setFieldErrors] = useState(
    /** @type {Record<string, string>} */ ({}),
  );
  const [submitError, setSubmitError] = useState('');
  const [submitSuccess, setSubmitSuccess] = useState('');

  const companiesQuery = useCompaniesQuery();
  const sellersQuery = useSellersQuery();
  const customersQuery = useCustomersQuery();
  const countriesQuery = useCountriesQuery();

  // "Nơi xếp hàng" is always sourced from Vietnam's catalogs —
  // every Incoterm here (EXW/FOB/CIF/DDP) starts the seller's leg
  // domestically. `vietnamCountryId` is '' until `countriesQuery` resolves
  // (or if no country coded "VN" / named "Việt Nam" exists yet), in
  // which case the loading-place picker below stays disabled/empty rather
  // than fetching the unfiltered (every-country) place list.
  const vietnamCountryId =
    findVietnamCountry(
      countriesQuery.data?.success ? countriesQuery.data.countries : [],
    )?.id ?? '';
  // Vietnamese ports plus Vietnamese delivery places (the factory an EXW
  // contract loads at moved to "Nơi giao hàng" with the UN/LOCODE catalog).
  const loadingPortsQuery = usePortsQuery({
    countryId: vietnamCountryId,
    enabled: Boolean(vietnamCountryId),
  });
  const loadingDeliveryPlacesQuery = useDeliveryPlacesQuery({
    countryId: vietnamCountryId,
    enabled: Boolean(vietnamCountryId),
  });
  // "Cảng đến" / "Nơi giao hàng" come from the selected export country's
  // `Port` / `DeliveryPlace` catalogs, fetched whenever a country is picked.
  const dischargePortsQuery = usePortsQuery({
    countryId: values.countryId,
    enabled: Boolean(values.countryId),
  });
  const deliveryPlacesQuery = useDeliveryPlacesQuery({
    countryId: values.countryId,
    enabled: Boolean(values.countryId),
  });

  const paymentTermRows = usePaymentTermRows(
    contract
      ? contract.paymentTerms.map((term) => ({
          rowKey: term.id,
          paymentRatioPercent: term.paymentRatioPercent,
          paymentCondition: term.paymentCondition,
        }))
      : undefined,
  );
  const sellerExtraFieldRows = useExtraFieldRows(
    (contract?.seller.extraFields ?? []).map((field) => ({
      rowKey: generateRowKey(),
      key: field.key,
      value: field.value,
    })),
  );
  const buyerExtraFieldRows = useExtraFieldRows(
    (contract?.buyer.extraFields ?? []).map((field) => ({
      rowKey: generateRowKey(),
      key: field.key,
      value: field.value,
    })),
  );

  const draftFingerprint = JSON.stringify({
    values,
    paymentTerms: paymentTermRows.rows,
    sellerExtras: sellerExtraFieldRows.rows,
    buyerExtras: buyerExtraFieldRows.rows,
  });
  const [initialFingerprint, setInitialFingerprint] =
    useState(draftFingerprint);

  const createMutation = useCreateContractMutation();
  const updateMutation = useUpdateContractMutation();

  const contractNumberExistsQuery = useContractNumberExistsQuery({
    contractNumber: values.contractNumber,
    excludeContractId: contract?.id,
  });

  /**
   * @param {string} field
   * @param {string | number | boolean | undefined} value
   */
  function setField(field, value) {
    setValues((current) => {
      const next = { ...current, [field]: value };
      // "Cảng đến" is scoped to the export country's `Port` catalog —
      // clear it when the country changes so a stale port can't slip
      // through.
      if (field === 'countryId') {
        next.placeOfDischarge = '';
      }
      // "Nơi giao hàng" only applies to DDP (`requiresPlaceOfDelivery`).
      if (
        field === 'incoterm' &&
        !requiresPlaceOfDelivery(
          /** @type {import('../types/index.js').Incoterm | ''} */ (
            next.incoterm
          ),
        )
      ) {
        next.placeOfDelivery = '';
      }
      // "Ngày hoàn thành dự án" only applies once the contract is actually
      // marked "Đã hoàn thành" — clear it whenever status moves away from
      // that, so a stale value from an earlier Completed state can't slip
      // through (same convention as placeOfDelivery above).
      if (field === 'status' && value !== 'Completed') {
        next.projectCompletionDate = '';
      }
      return next;
    });
  }

  /**
   * @param {'companyName' | 'representativeName' | 'representativeTitle' | 'address'} field
   * @param {string} value
   */
  function setSellerInlineField(field, value) {
    setValues((current) => ({
      ...current,
      sellerInline: { ...current.sellerInline, [field]: value },
    }));
  }

  /**
   * Selecting an existing seller prefills representative/title/address/
   * extra fields from its current catalog record — mirrors
   * `selectExistingCustomer`.
   * @param {string} sellerId
   * @param {import('../types/index.js').Seller} [knownSeller]
   */
  function selectExistingSeller(sellerId, knownSeller) {
    const sellers = sellersQuery.data?.success ? sellersQuery.data.sellers : [];
    const seller =
      knownSeller ?? sellers.find((candidate) => candidate.id === sellerId);

    // Beneficiary banks are the seller's own accounts: keep the ones that
    // belong to it, else preselect its default account.
    const accountIds = (seller?.bankAccounts ?? []).map(
      (account) => account.id,
    );
    const defaultAccountId = (seller?.bankAccounts ?? []).find(
      (account) => account.isDefault,
    )?.id;
    setValues((current) => {
      const kept = current.bankIds.filter((id) => accountIds.includes(id));
      return {
        ...current,
        sourceSellerId: sellerId,
        bankIds:
          kept.length > 0 || !defaultAccountId ? kept : [defaultAccountId],
        sellerInline: {
          companyName: '',
          representativeName: seller?.representativeName ?? '',
          representativeTitle: seller?.representativeTitle ?? '',
          address: seller?.address ?? '',
        },
      };
    });
    sellerExtraFieldRows.setRows(
      (seller?.extraFields ?? []).map((field) => ({
        rowKey: generateRowKey(),
        key: field.key,
        value: field.value,
      })),
    );
  }

  function switchToInlineSeller() {
    // An inline seller has no accounts to pick from.
    setValues((current) => ({ ...current, sourceSellerId: '', bankIds: [] }));
  }

  const changeSellerBankAccount = useChangeSellerBankAccount();

  /**
   * "+" next to the bank picker: adds an account to the selected seller
   * and selects it.
   * @param {{ kind: 'add' | 'update', accountId?: string, account: any }} operation
   */
  async function addSellerBankAccount(operation) {
    const sellerId = values.sourceSellerId;
    if (!sellerId) {
      return { success: false, message: 'Chọn bên bán trước' };
    }
    const before = new Set(sellerBankAccounts.map((account) => account.id));
    const result = await changeSellerBankAccount(sellerId, operation);
    if (result.success) {
      const added = result.accounts.find((account) => !before.has(account.id));
      if (added?.id) {
        setValues((current) => ({
          ...current,
          bankIds: [...current.bankIds, /** @type {string} */ (added.id)],
        }));
      }
    }
    return result;
  }

  /**
   * @param {'companyName' | 'representativeName' | 'representativeTitle' | 'address'} field
   * @param {string} value
   */
  function setBuyerInlineField(field, value) {
    setValues((current) => ({
      ...current,
      buyerInline: { ...current.buyerInline, [field]: value },
    }));
  }

  /**
   * Selecting an existing customer prefills representative/title/address/
   * extra fields from its current catalog record — a starting point the
   * user can still edit per contract, since only CompanyName stays pinned
   * to the catalog (see `docs/api/Contracts.md`, BE-kt-xnk). `knownCustomer`
   * lets a caller that already has the full record (the quick-create dialog,
   * whose freshly-created customer may not be in `customersQuery`'s cache
   * yet) skip the lookup.
   * @param {string} customerId
   * @param {import('../types/index.js').Customer} [knownCustomer]
   */
  function selectExistingCustomer(customerId, knownCustomer) {
    const customers = customersQuery.data?.success
      ? customersQuery.data.customers
      : [];
    const customer =
      knownCustomer ??
      customers.find((candidate) => candidate.id === customerId);

    setValues((current) => ({
      ...current,
      sourceCustomerId: customerId,
      buyerInline: {
        companyName: '',
        representativeName: customer?.representativeName ?? '',
        representativeTitle: customer?.representativeTitle ?? '',
        address: customer?.address ?? '',
      },
    }));
    buyerExtraFieldRows.setRows(
      (customer?.extraFields ?? []).map((field) => ({
        rowKey: generateRowKey(),
        key: field.key,
        value: field.value,
      })),
    );
  }

  function switchToInlineBuyer() {
    setValues((current) => ({ ...current, sourceCustomerId: '' }));
  }

  const selectedSeller = values.sourceSellerId
    ? (sellersQuery.data?.success ? sellersQuery.data.sellers : []).find(
        (seller) => seller.id === values.sourceSellerId,
      )
    : undefined;
  /** @type {import('@/shared/api/bank-accounts.js').BankAccount[]} */
  const sellerBankAccounts = selectedSeller?.bankAccounts ?? [];

  /** @param {string[]} bankIds */
  function setBankIds(bankIds) {
    setValues((current) => ({ ...current, bankIds }));
  }

  // "Hủy" (no remount to fall back on — see `ContractFormDialog`, task
  // 1.2) needs an explicit way back to the last-saved baseline, same idea
  // as `useCommissionForm`/`useContractPrivateInfoForm`'s `reset`.
  function reset() {
    setValues(contract ? valuesFromContract(contract) : emptyValues());
    setFieldErrors({});
    setSubmitError('');
    setSubmitSuccess('');
    setVersion(contract?.version);
    paymentTermRows.setRows(
      contract
        ? contract.paymentTerms.map((term) => ({
            rowKey: term.id,
            paymentRatioPercent: term.paymentRatioPercent,
            paymentCondition: term.paymentCondition,
          }))
        : [],
    );
    sellerExtraFieldRows.setRows(
      (contract?.seller.extraFields ?? []).map((field) => ({
        rowKey: generateRowKey(),
        key: field.key,
        value: field.value,
      })),
    );
    buyerExtraFieldRows.setRows(
      (contract?.buyer.extraFields ?? []).map((field) => ({
        rowKey: generateRowKey(),
        key: field.key,
        value: field.value,
      })),
    );
  }

  /** @param {import('react').FormEvent<HTMLFormElement>} event */
  async function handleSubmit(event) {
    event.preventDefault();
    if (createMutation.isPending || updateMutation.isPending) return;
    setSubmitError('');
    setSubmitSuccess('');

    const candidate = {
      ...values,
      paymentTerms: paymentTermRows.rows.map((row) => ({
        paymentRatioPercent: row.paymentRatioPercent,
        paymentCondition: row.paymentCondition,
      })),
    };

    const result = contractSchema.safeParse(candidate);
    if (!result.success) {
      /** @type {Record<string, string>} */
      const nextFieldErrors = {};
      for (const issue of result.error.issues) {
        const key = issue.path.join('.');
        if (!nextFieldErrors[key]) {
          nextFieldErrors[key] = issue.message;
        }
      }
      setFieldErrors(nextFieldErrors);
      setSubmitError(
        'Vui lòng kiểm tra các trường được đánh dấu trước khi lưu.',
      );
      return;
    }

    setFieldErrors({});

    const extra = {
      paymentTerms: result.data.paymentTerms,
      sellerExtraFieldRows: sellerExtraFieldRows.rows,
      buyerExtraFieldRows: buyerExtraFieldRows.rows,
    };

    const mutationResult = contract
      ? await updateMutation.mutateAsync({
          contractId: contract.id,
          values: result.data,
          extra: { ...extra, version },
        })
      : await createMutation.mutateAsync({ values: result.data, extra });

    if (!mutationResult.success) {
      setSubmitError(mutationResult.message);
      return;
    }

    setVersion(mutationResult.contract.version);
    setSubmitSuccess(isEdit ? 'Đã cập nhật hợp đồng.' : 'Đã tạo hợp đồng.');
    // The caller no longer remounts this form on save success (see
    // `ContractFormDialog`) — move the dirty baseline up to what was just
    // submitted so `isDirty` doesn't stay stuck "true" (and misfire the
    // discard-confirmation guard) after a clean save.
    setInitialFingerprint(draftFingerprint);
    onSuccess?.(mutationResult.contract);
  }

  /** @type {Record<string, { type: 'error', message: string } | undefined>} */
  const baseFieldStatuses = Object.fromEntries(
    Object.entries(fieldErrors).map(([key, message]) => [
      key,
      fieldStatus(message),
    ]),
  );

  // Schema errors (e.g. "required") win over the duplicate-number check —
  // both would otherwise fight for the same status slot. Once a check has
  // actually completed, show its outcome either way (duplicate or clear) so
  // the user isn't left guessing whether anything happened.
  /** @type {{ type: 'error' | 'success', message: string } | undefined} */
  const contractNumberDuplicateStatus =
    !contractNumberExistsQuery.isChecking &&
    contractNumberExistsQuery.result?.success
      ? contractNumberExistsQuery.result.exists
        ? { type: 'error', message: 'Số hợp đồng này đã được sử dụng' }
        : { type: 'success', message: 'Số hợp đồng chưa được sử dụng' }
      : undefined;

  /** @type {Record<string, { type: 'error' | 'success', message: string } | undefined>} */
  const fieldStatuses = {
    ...baseFieldStatuses,
    contractNumber:
      baseFieldStatuses.contractNumber ?? contractNumberDuplicateStatus,
  };

  return {
    isDirty: draftFingerprint !== initialFingerprint,
    reset,
    mode: isEdit ? 'edit' : 'create',
    title: isEdit ? 'CẬP NHẬT HỢP ĐỒNG' : 'TẠO HỢP ĐỒNG',
    submitLabel: isEdit ? 'Lưu thay đổi' : 'Tạo hợp đồng',
    values,
    setField,
    setSellerInlineField,
    selectExistingSeller,
    switchToInlineSeller,
    setBuyerInlineField,
    selectExistingCustomer,
    switchToInlineBuyer,
    setBankIds,
    fieldStatuses,
    isCheckingContractNumber: contractNumberExistsQuery.isChecking,
    companies: companiesQuery.data ?? [],
    isCompanyFixed: isEdit,
    sellers: sellersQuery.data?.success ? sellersQuery.data.sellers : [],
    customers: customersQuery.data?.success
      ? customersQuery.data.customers
      : [],
    countries: countriesQuery.data?.success
      ? countriesQuery.data.countries
      : [],
    vietnamCountryId,
    loadingPlaces: dedupePlacesByName([
      ...(loadingPortsQuery.data?.success
        ? loadingPortsQuery.data.ports.map(portOption)
        : []),
      ...(loadingDeliveryPlacesQuery.data?.success
        ? loadingDeliveryPlacesQuery.data.deliveryPlaces.map(
            deliveryPlaceOption,
          )
        : []),
    ]),
    isPlaceOfDeliveryApplicable: requiresPlaceOfDelivery(values.incoterm),
    dischargePlaces: dedupePlacesByName(
      dischargePortsQuery.data?.success
        ? dischargePortsQuery.data.ports.map(portOption)
        : [],
    ),
    deliveryPlaces: dedupePlacesByName(
      deliveryPlacesQuery.data?.success
        ? deliveryPlacesQuery.data.deliveryPlaces.map(deliveryPlaceOption)
        : [],
    ),
    banks: sellerBankAccounts,
    selectedSeller,
    addSellerBankAccount,
    paymentTermRows,
    sellerExtraFieldRows,
    buyerExtraFieldRows,
    submitError,
    submitSuccess,
    isSubmitting: createMutation.isPending || updateMutation.isPending,
    handleSubmit,
  };
}
