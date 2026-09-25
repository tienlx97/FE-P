'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

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
