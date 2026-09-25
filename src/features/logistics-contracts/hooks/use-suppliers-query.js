'use client';

import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { useEffect, useState } from 'react';

import { searchCommissions } from '../api/commissions.js';
import { searchAllShipments } from '../api/shipments.js';
import {
  createSupplier,
  deleteSupplier,
  getSupplier,
  listSuppliers,
  searchSuppliers,
  updateSupplier,
} from '../api/suppliers.js';

const QUERY_KEY = ['logistics-contracts', 'suppliers'];
const SEARCH_KEY = ['logistics-contracts', 'suppliers-search'];

export function useSuppliersQuery() {
  return useQuery({ queryKey: QUERY_KEY, queryFn: listSuppliers });
}

/** @param {{page: number, pageSize: number, conditions?: any[]}} params */
export function useSearchSuppliersQuery({ page, pageSize, conditions = [] }) {
  return useQuery({
    queryKey: [...SEARCH_KEY, page, pageSize, conditions],
    queryFn: () => searchSuppliers({ page, pageSize, conditions }),
  });
}

/**
 * One supplier by id — key under `QUERY_KEY`, so every supplier mutation's
 * `invalidateQueries({ queryKey: QUERY_KEY })` refreshes it too.
 * @param {string} supplierId
 */
export function useSupplierQuery(supplierId) {
  return useQuery({
    queryKey: [...QUERY_KEY, supplierId],
    queryFn: () => getSupplier(supplierId),
  });
}

/**
 * `BankAccountsPanel.onChanged` for a supplier: the per-account endpoints
 * return the whole supplier — written into the detail query — then the
 * supplier lists refetch.
 * @param {string} supplierId
 */
export function useSupplierBankAccountsChanged(supplierId) {
  const queryClient = useQueryClient();
  return (/** @type {{ data: any }} */ { data }) => {
    queryClient.setQueryData([...QUERY_KEY, supplierId], {
      success: true,
      supplier: data,
    });
    queryClient.invalidateQueries({ queryKey: SEARCH_KEY });
  };
}

/**
 * Shipment / Commission tab counts on the supplier detail page: a
 * one-row search per list, reading `totalCount` (BE-kt-xnk
 * `supplier-detail-api` filters). `undefined` while loading or on error.
 * @param {string} supplierId
 */
export function useSupplierRelatedCounts(supplierId) {
  /** @param {string} field */
  const byField = (field) => [
    {
      id: field,
      field,
      operator: 'Equals',
      value: supplierId,
      valueTo: '',
      connector: /** @type {'And'} */ ('And'),
    },
  ];
  const shipments = useQuery({
    queryKey: ['logistics-contracts', 'supplier-shipment-count', supplierId],
    queryFn: () =>
      searchAllShipments({
        page: 1,
        pageSize: 1,
        conditions: byField('involvedSupplierId'),
      }),
  });
  const commissions = useQuery({
    queryKey: ['logistics-contracts', 'supplier-commission-count', supplierId],
    queryFn: () =>
      searchCommissions({
        page: 1,
        pageSize: 1,
        conditions: byField('partyCustomerId'),
      }),
  });
  return {
    shipmentCount: shipments.data?.success
      ? shipments.data.totalCount
      : undefined,
    commissionCount: commissions.data?.success
      ? commissions.data.totalCount
      : undefined,
  };
}

/**
 * `involvedSupplierId` plus, when `search` is set, "booking / contract
 * number / lot name contains" OR-ed together. The backend folds conditions
 * left to right, so the OR group goes first and the supplier condition
 * last: `(booking OR contract OR name) AND supplier`. A full shipment code
 * ("26KCT34/LOT-01") is not filterable — its contract part is searched.
 * @param {string} supplierId
 * @param {string} search
 */
export function supplierShipmentConditions(supplierId, search) {
  const term = search.trim();
  /** @param {string} field @param {string} value @param {'And' | 'Or'} connector */
  const contains = (field, value, connector) => ({
    id: `${field}-${value}`,
    field,
    operator: 'Contains',
    value,
    valueTo: '',
    connector,
  });
  const contractPart = term.includes('/') ? term.split('/')[0] : term;
  return [
    ...(term
      ? [
          contains('bookingNumber', term, 'And'),
          contains('contractNumber', contractPart, 'Or'),
          contains('name', term, 'Or'),
        ]
      : []),
    {
      id: 'involvedSupplierId',
      field: 'involvedSupplierId',
      operator: 'Equals',
      value: supplierId,
      valueTo: '',
      connector: /** @type {'And'} */ ('And'),
    },
  ];
}

/**
 * Supplier detail "Shipment" tab: one page of the shipments the supplier
 * takes part in (forwarder, service provider or cost provider). `search`
 * is debounced here so typing doesn't fire a request per key.
 * @param {string} supplierId
 * @param {{ page: number, pageSize: number, search: string }} params
 */
export function useSupplierShipmentsQuery(
  supplierId,
  { page, pageSize, search },
) {
  const trimmed = search.trim();
  const [debounced, setDebounced] = useState(trimmed);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(trimmed), 300);
    return () => clearTimeout(timer);
  }, [trimmed]);

  const query = useQuery({
    queryKey: [
      'logistics-contracts',
      'supplier-shipments',
      supplierId,
      page,
      pageSize,
      debounced,
    ],
    queryFn: () =>
      searchAllShipments({
        page,
        pageSize,
        conditions: supplierShipmentConditions(supplierId, debounced),
      }),
    placeholderData: keepPreviousData,
  });
  return { ...query, search: debounced };
}

/** @param {(value: any) => Promise<any>} mutationFn */
function useSupplierMutation(mutationFn) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn,
    onSuccess: (result) => {
      if (result.success) {
        queryClient.invalidateQueries({ queryKey: QUERY_KEY });
        queryClient.invalidateQueries({ queryKey: SEARCH_KEY });
        // Group tab counts (`supplierCount`) change with every save/delete.
        queryClient.invalidateQueries({
          queryKey: ['logistics-contracts', 'supplier-groups'],
        });
      }
    },
  });
}

export function useCreateSupplierMutation() {
  /** @param {any} payload */
  const mutation = (payload) => {
    const { values, extraFieldRows, bankAccounts, deliveryAddresses } = payload;
    return createSupplier(
      values,
      extraFieldRows,
      bankAccounts,
      deliveryAddresses,
    );
  };
  return useSupplierMutation(mutation);
}

export function useUpdateSupplierMutation() {
  /** @param {any} payload */
  const mutation = (payload) =>
    updateSupplier(
      payload.supplierId,
      payload.values,
      payload.extraFieldRows,
      payload.bankAccounts,
      payload.deliveryAddresses,
    );
  return useSupplierMutation(mutation);
}

export function useDeleteSupplierMutation() {
  return useSupplierMutation((/** @type {string} */ supplierId) =>
    deleteSupplier(supplierId),
  );
}
