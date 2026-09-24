'use client';

import { useState } from 'react';

import { DEFAULT_CURRENCY } from '../config/currencies.js';
import { splitSiCutoff } from '../config/shipment-operational-details.js';
import { shipmentSchema } from '../config/shipment-schema.js';
import { SHIPMENT_STATUSES } from '../config/shipment-status.js';
import { useShipmentCostLineRows } from './use-shipment-cost-line-rows.js';
import {
  useCreateShipmentMutation,
  useUpdateShipmentMutation,
} from './use-shipments-query.js';
import { useSuppliersQuery } from './use-suppliers-query.js';

/**
 * `placeOfLoading`/`placeOfDischarge` default from the parent Contract's
 * own fields (client-side only — see the type's own doc comment) so a new
 * shipment starts pre-filled with the contract's usual ports but can
 * diverge immediately; `contract` is optional purely so callers that
 * don't have one loaded yet (or are editing, where `valuesFromShipment`
 * takes over instead) don't need a placeholder.
 * @param {import('../types/index.js').Contract | null} [contract]
 * @returns {import('../types/index.js').ShipmentFormValues}
 */
function emptyValues(contract = null) {
  return {
    supplierCustomerId: '',
    customsBrokerIds: [],
    truckingIds: [],
    bookingNumber: '',
    billOfLadingNumber: '',
    shippingLine: '',
    vesselName: '',
    etd: '',
    eta: '',
    placeOfLoading: contract?.placeOfLoading ?? '',
    placeOfDischarge: contract?.placeOfDischarge ?? '',
    type: '',
    name: '',
    paymentCondition: '',
    invoiceValue: undefined,
    invoiceCurrency: DEFAULT_CURRENCY,
    declarationValue: undefined,
    declarationCurrency: DEFAULT_CURRENCY,
    declarationExchangeRate: undefined,
    quantityAmount: undefined,
    declarationWeightKg: undefined,
    coNumber: '',
    coDeclarationDate: '',
    coIssuedDate: '',
    customsDeclarationNumber: '',
    customsDeclarationDate: '',
    customsInspected: false,
    // New shipments default to "Đã book" — matches the backend's own
    // default (BE-kt-xnk).
    status: SHIPMENT_STATUSES[0],
    invoiceNumber: '',
    voyageNumber: '',
    siCutoffDate: '',
    siCutoffTime: '',
    serviceTerm: '',
    isTransshipment: false,
    coForm: '',
    customsChannel: '',
    letterOfCreditNumber: '',
    emptyReturnDeadline: '',
  };
}

/**
 * @param {import('../types/index.js').Shipment} shipment
 * @returns {import('../types/index.js').ShipmentFormValues}
 */
function valuesFromShipment(shipment) {
  const details = shipment.operationalDetails;
  const siCutoff = splitSiCutoff(details?.siCutoff);
  return {
    supplierCustomerId: shipment.supplierCustomerId,
    customsBrokerIds: (shipment.serviceProviders ?? [])
      .filter((provider) => provider.role === 'CustomsBroker')
      .map((provider) => provider.supplierId),
    truckingIds: (shipment.serviceProviders ?? [])
      .filter((provider) => provider.role === 'Trucking')
      .map((provider) => provider.supplierId),
    bookingNumber: shipment.bookingNumber,
    billOfLadingNumber: shipment.billOfLadingNumber ?? '',
    shippingLine: shipment.shippingLine ?? '',
    vesselName: shipment.vesselName ?? '',
    etd: shipment.etd ?? '',
    eta: shipment.eta ?? '',
    placeOfLoading: shipment.placeOfLoading ?? '',
    placeOfDischarge: shipment.placeOfDischarge ?? '',
    type: shipment.type,
    name: shipment.name,
    paymentCondition: shipment.paymentCondition,
    invoiceValue: shipment.invoiceValue,
    invoiceCurrency: shipment.invoiceCurrency,
    declarationValue: shipment.declarationValue,
    declarationCurrency: shipment.declarationCurrency,
    declarationExchangeRate: shipment.declarationExchangeRate,
    quantityAmount: shipment.quantityAmount,
    declarationWeightKg: shipment.declarationWeightKg,
    coNumber: shipment.coNumber ?? '',
    coDeclarationDate: shipment.coDeclarationDate ?? '',
    coIssuedDate: shipment.coIssuedDate ?? '',
    customsDeclarationNumber: shipment.customsDeclarationNumber ?? '',
    customsDeclarationDate: shipment.customsDeclarationDate ?? '',
    customsInspected: shipment.customsInspected,
    status: shipment.status,
    invoiceNumber: details?.invoiceNumber ?? '',
    voyageNumber: details?.voyageNumber ?? '',
    siCutoffDate: siCutoff.date,
    siCutoffTime: siCutoff.time,
    serviceTerm: details?.serviceTerm ?? '',
    isTransshipment: details?.isTransshipment ?? false,
    coForm: details?.coForm ?? '',
    customsChannel: details?.customsChannel ?? '',
    letterOfCreditNumber: details?.letterOfCreditNumber ?? '',
    emptyReturnDeadline: details?.emptyReturnDeadline ?? '',
  };
}

/** @param {string} [message] @returns {{ type: 'error', message: string } | undefined} */
function fieldStatus(message) {
  return message ? { type: 'error', message } : undefined;
}

/**
 * Form state for creating/updating a `Shipment`. Pass `shipment` to edit an
 * existing one — `shipmentNumber`/`shipmentCode` are never editable
 * (backend-assigned), so they never appear in `values`.
 * @param {{
 *   contractId: string,
 *   contract?: import('../types/index.js').Contract | null,
 *   shipment?: import('../types/index.js').Shipment | null,
 *   onSuccess?: (shipment: import('../types/index.js').Shipment) => void,
 * }} options
 */
export function useShipmentForm({
  contractId,
  contract = null,
  shipment = null,
  onSuccess,
}) {
  const [version, setVersion] = useState(shipment?.version);
  const [values, setValues] = useState(
    shipment ? valuesFromShipment(shipment) : emptyValues(contract),
  );
  const [fieldErrors, setFieldErrors] = useState(
    /** @type {Record<string, string>} */ ({}),
  );
  const [submitError, setSubmitError] = useState('');

  const suppliersQuery = useSuppliersQuery();
  const createMutation = useCreateShipmentMutation(contractId);
  const updateMutation = useUpdateShipmentMutation(contractId);

  const costLineRows = useShipmentCostLineRows(
    shipment
      ? shipment.costs.map((cost) => ({
          rowKey: cost.id,
          costCategoryId: cost.costCategoryId,
          name: cost.name,
          amount: cost.amount,
          note: cost.note ?? '',
          providerCustomerId: cost.providerCustomerId ?? '',
          invoiceNumber: cost.invoiceNumber ?? '',
          costNature: cost.costNature ?? 'Standard',
        }))
      : undefined,
  );

  /**
   * @template {keyof import('../types/index.js').ShipmentFormValues} K
   * @param {K} field
   * @param {import('../types/index.js').ShipmentFormValues[K]} value
   */
  function setField(field, value) {
    setValues((current) => ({ ...current, [field]: value }));
  }

  function reset() {
    setVersion(shipment?.version);
    setValues(shipment ? valuesFromShipment(shipment) : emptyValues(contract));
    setFieldErrors({});
    setSubmitError('');
    costLineRows.setRows(
      shipment
        ? shipment.costs.map((cost) => ({
            rowKey: cost.id,
            costCategoryId: cost.costCategoryId,
            name: cost.name,
            amount: cost.amount,
            note: cost.note ?? '',
            providerCustomerId: cost.providerCustomerId ?? '',
            invoiceNumber: cost.invoiceNumber ?? '',
            costNature: cost.costNature ?? 'Standard',
          }))
        : [],
    );
  }

  /** @param {import('react').FormEvent<HTMLFormElement>} [event] */
  async function handleSubmit(event) {
    event?.preventDefault();
    setSubmitError('');

    const candidate = {
      ...values,
      costLines: costLineRows.rows.map((row) => ({
        costCategoryId: row.costCategoryId,
        name: row.name,
        amount: row.amount,
        note: row.note,
        providerCustomerId: row.providerCustomerId,
        invoiceNumber: row.invoiceNumber,
        costNature: row.costNature,
      })),
    };

    const result = shipmentSchema.safeParse(candidate);
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
      return Object.keys(nextFieldErrors).some(
        (key) => !key.startsWith('costLines'),
      )
        ? 'info'
        : 'costs';
    }

    setFieldErrors({});

    const { costLines, ...submittedValues } = result.data;
    const mutationResult = shipment
      ? await updateMutation.mutateAsync({
          shipmentId: shipment.id,
          version,
          values: submittedValues,
          costLines,
        })
      : await createMutation.mutateAsync({
          values: submittedValues,
          costLines,
        });

    if (!mutationResult.success) {
      setSubmitError(mutationResult.message);
      return;
    }

    setVersion(mutationResult.shipment.version);
    onSuccess?.(mutationResult.shipment);
    if (!shipment) reset();
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
    costLineRows,
    submitError,
    isSubmitting: createMutation.isPending || updateMutation.isPending,
    handleSubmit,
    reset,
  };
}
