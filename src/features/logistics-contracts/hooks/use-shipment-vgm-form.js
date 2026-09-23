'use client';

import { useState } from 'react';

import { shipmentVgmSchema } from '../config/shipment-vgm-schema.js';
import {
  useCreateShipmentVgmMutation,
  useUpdateShipmentVgmMutation,
} from './use-shipment-vgms-query.js';
import { useSuppliersQuery } from './use-suppliers-query.js';

/** @returns {import('../types/index.js').ShipmentVgmFormValues} */
function emptyValues() {
  return {
    containerNumber: '',
    sealNumber: '',
    containerType: '',
    tare: undefined,
    payload: undefined,
    maxGross: undefined,
    netWeight: undefined,
    packagingWeight: undefined,
    packingDate: '',
    plannedPackingTime: '',
    actualPackingTime: '',
    truckArrivalTime: '',
    carrierCustomerId: '',
    note: '',
  };
}

/** @param {import('../types/index.js').ShipmentVgm} vgm */
function valuesFromVgm(vgm) {
  return {
    containerNumber: vgm.containerNumber,
    sealNumber: vgm.sealNumber,
    containerType: vgm.containerType,
    tare: vgm.tare,
    payload: vgm.payload,
    maxGross: vgm.maxGross,
    netWeight: vgm.netWeight,
    packagingWeight: vgm.packagingWeight,
    packingDate: vgm.packingDate,
    plannedPackingTime: vgm.plannedPackingTime ?? '',
    actualPackingTime: vgm.actualPackingTime ?? '',
    truckArrivalTime: vgm.truckArrivalTime ?? '',
    carrierCustomerId: vgm.carrierCustomerId,
    note: vgm.note ?? '',
  };
}

/** @param {string} [message] @returns {{ type: 'error', message: string } | undefined} */
function fieldStatus(message) {
  return message ? { type: 'error', message } : undefined;
}

/**
 * Form state for creating/updating a `ShipmentVgm`. Pass `vgm` to edit an
 * existing one — `sequenceNumber`/`grossWeight`/`vgm` are never editable
 * (backend-assigned/computed), so they never appear in `values`. Also
 * fetches the `Customer` catalog for `carrierCustomerId`'s picker, same
 * pattern as `useShipmentForm`'s `supplierCustomerId`.
 * @param {{
 *   contractId: string,
 *   shipmentId: string,
 *   vgm?: import('../types/index.js').ShipmentVgm | null,
 *   onSuccess?: (vgm: import('../types/index.js').ShipmentVgm) => void,
 * }} options
 */
export function useShipmentVgmForm({
  contractId,
  shipmentId,
  vgm = null,
  onSuccess,
}) {
  const [values, setValues] = useState(
    vgm ? valuesFromVgm(vgm) : emptyValues(),
  );
  const [fieldErrors, setFieldErrors] = useState(
    /** @type {Record<string, string>} */ ({}),
  );
  const [submitError, setSubmitError] = useState('');

  const suppliersQuery = useSuppliersQuery();
  const createMutation = useCreateShipmentVgmMutation(contractId, shipmentId);
  const updateMutation = useUpdateShipmentVgmMutation(contractId, shipmentId);

  /**
   * @template {keyof import('../types/index.js').ShipmentVgmFormValues} K
   * @param {K} field
   * @param {import('../types/index.js').ShipmentVgmFormValues[K]} value
   */
  function setField(field, value) {
    setValues((current) => ({ ...current, [field]: value }));
  }

  function reset() {
    setValues(vgm ? valuesFromVgm(vgm) : emptyValues());
    setFieldErrors({});
    setSubmitError('');
  }

  /** @param {import('react').FormEvent<HTMLFormElement>} [event] */
  async function handleSubmit(event) {
    event?.preventDefault();
    setSubmitError('');

    const result = shipmentVgmSchema.safeParse(values);
    if (!result.success) {
      /** @type {Record<string, string>} */
      const nextFieldErrors = {};
      for (const issue of result.error.issues) {
        nextFieldErrors[String(issue.path[0])] = issue.message;
      }
      setFieldErrors(nextFieldErrors);
      return;
    }

    setFieldErrors({});

    const mutationResult = vgm
      ? await updateMutation.mutateAsync({ vgmId: vgm.id, values: result.data })
      : await createMutation.mutateAsync(result.data);

    if (!mutationResult.success) {
      setSubmitError(mutationResult.message);
      return;
    }

    onSuccess?.(mutationResult.vgm);
    if (!vgm) reset();
  }

  return {
    values,
    setField,
    fieldStatuses: Object.fromEntries(
      Object.entries(fieldErrors).map(([key, message]) => [
        key,
        fieldStatus(message),
      ]),
    ),
    customers: suppliersQuery.data?.success
      ? suppliersQuery.data.suppliers
      : [],
    submitError,
    isSubmitting: createMutation.isPending || updateMutation.isPending,
    handleSubmit,
    reset,
  };
}
