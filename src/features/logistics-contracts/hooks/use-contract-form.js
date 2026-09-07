'use client';

import { useState } from 'react';

import { contractSchema } from '../config/contract-schema.js';
import { CONTRACT_STATUSES } from '../config/contract-status.js';
import { CONTRACT_TYPES } from '../config/contract-types.js';
import { DEFAULT_CURRENCY } from '../config/currencies.js';
import { requiresPlaceOfDischarge } from '../config/incoterms.js';
import { findVietnamCountry } from '../config/vietnam-country.js';
import { useContractBanksQuery } from './use-contract-banks-query.js';
import { useContractNumberExistsQuery } from './use-contract-number-exists-query.js';
import {
  useCreateContractMutation,
  useUpdateContractMutation,
} from './use-contracts-query.js';
import { useCountriesQuery } from './use-countries-query.js';
import { useCustomersQuery } from './use-customers-query.js';
import { useExtraFieldRows } from './use-extra-field-rows.js';
import { useCompaniesQuery } from './use-org-directory.js';
import { usePaymentTermRows } from './use-payment-term-rows.js';
import { usePlacesQuery } from './use-places-query.js';
import { useSellersQuery } from './use-sellers-query.js';

const TODAY_ISO = new Date().toISOString().slice(0, 10);
const CURRENT_YEAR = new Date().getFullYear();

/**
 * `placeOfLoading`/`placeOfDischarge` are plain strings on the wire (see
 * `types/index.js`), so the Selectors backing them in
 * `ContractFormDialog` key their options by `Place.name`, not `Place.id`.
 * The `Place` catalog has no uniqueness constraint on `name` (two entries
 * for the same country can share a name — e.g. created twice by mistake),
 * which would otherwise surface as a "two children with the same key"
 * React warning/crash in the Selector's option list. Collapsing to one
 * option per distinct name here (first occurrence wins) keeps every
 * consumer of `loadingPlaces`/`dischargePlaces` safe without each having
 * to know why.
 * @param {import('../types/index.js').Place[]} places
 * @returns {import('../types/index.js').Place[]}
 */
function dedupePlacesByName(places) {
  const seen = new Set();
  return places.filter((place) => {
    if (seen.has(place.name)) return false;
    seen.add(place.name);
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
    projectName: '',
    category: '',
    countryId: '',
    placeOfLoading: '',
    placeOfDischarge: '',
    contractValue: undefined,
    currency: DEFAULT_CURRENCY,
    incoterm: '',
    incotermYear: CURRENT_YEAR,
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
    projectName: contract.projectName,
    category: contract.category,
    countryId: contract.countryId,
    placeOfLoading: contract.placeOfLoading,
    // null for EXW/FOB (BE-kt-xnk sends it that way — see
    // requiresPlaceOfDischarge()) — normalize like every other nullable
    // snapshot field here, or the form's own "must be empty for EXW/FOB"
    // refine throws calling .length on null.
    placeOfDischarge: contract.placeOfDischarge ?? '',
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
  const banksQuery = useContractBanksQuery();
  const countriesQuery = useCountriesQuery();

  // "Nơi xếp hàng" is always sourced from Vietnam's `Place` catalog —
  // every Incoterm here (EXW/FOB/CIF/DDP) starts the seller's leg
  // domestically. `vietnamCountryId` is '' until `countriesQuery` resolves
  // (or if no country named "Việt Nam" exists in the catalog yet), in
  // which case the loading-place picker below stays disabled/empty rather
  // than fetching the unfiltered (every-country) place list.
  const vietnamCountryId =
    findVietnamCountry(
      countriesQuery.data?.success ? countriesQuery.data.countries : [],
    )?.id ?? '';
  const loadingPlacesQuery = usePlacesQuery({
    countryId: vietnamCountryId,
    enabled: Boolean(vietnamCountryId),
  });
  // "Cảng/nơi đến" is sourced from the selected export country's `Place`
  // catalog, only meaningful for DDP/CIF (see `requiresPlaceOfDischarge`).
  // Fetched whenever a country is picked (not gated on incoterm too) so
  // the list is already warm if the user switches into DDP/CIF.
  const dischargePlacesQuery = usePlacesQuery({
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
      rowKey: crypto.randomUUID(),
      key: field.key,
      value: field.value,
    })),
  );
  const buyerExtraFieldRows = useExtraFieldRows(
    (contract?.buyer.extraFields ?? []).map((field) => ({
      rowKey: crypto.randomUUID(),
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
  const [initialFingerprint] = useState(draftFingerprint);

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
      // "Cảng/nơi đến" only applies to DDP/CIF (see
      // `requiresPlaceOfDischarge`) and is scoped to the export country's
      // `Place` catalog — clear it whenever either stops holding, so a
      // stale value from a different Incoterm/country can't slip through.
      if (
        (field === 'incoterm' &&
          !requiresPlaceOfDischarge(
            /** @type {import('../types/index.js').Incoterm | ''} */ (
              next.incoterm
            ),
          )) ||
        field === 'countryId'
      ) {
        next.placeOfDischarge = '';
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

    setValues((current) => ({
      ...current,
      sourceSellerId: sellerId,
      sellerInline: {
        companyName: '',
        representativeName: seller?.representativeName ?? '',
        representativeTitle: seller?.representativeTitle ?? '',
        address: seller?.address ?? '',
      },
    }));
    sellerExtraFieldRows.setRows(
      (seller?.extraFields ?? []).map((field) => ({
        rowKey: crypto.randomUUID(),
        key: field.key,
        value: field.value,
      })),
    );
  }

  function switchToInlineSeller() {
    setValues((current) => ({ ...current, sourceSellerId: '' }));
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
        rowKey: crypto.randomUUID(),
        key: field.key,
        value: field.value,
      })),
    );
  }

  function switchToInlineBuyer() {
    setValues((current) => ({ ...current, sourceCustomerId: '' }));
  }

  /** @param {string[]} bankIds */
  function setBankIds(bankIds) {
    setValues((current) => ({ ...current, bankIds }));
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
    loadingPlaces: dedupePlacesByName(
      loadingPlacesQuery.data?.success ? loadingPlacesQuery.data.places : [],
    ),
    isPlaceOfDischargeApplicable: requiresPlaceOfDischarge(values.incoterm),
    dischargePlaces: dedupePlacesByName(
      dischargePlacesQuery.data?.success
        ? dischargePlacesQuery.data.places
        : [],
    ),
    banks: banksQuery.data?.success ? banksQuery.data.banks : [],
    paymentTermRows,
    sellerExtraFieldRows,
    buyerExtraFieldRows,
    submitError,
    submitSuccess,
    isSubmitting: createMutation.isPending || updateMutation.isPending,
    handleSubmit,
  };
}
