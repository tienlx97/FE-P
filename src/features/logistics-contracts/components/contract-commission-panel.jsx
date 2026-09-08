'use client';

import { Banner } from '@astryxdesign/core/Banner';
import { Button } from '@astryxdesign/core/Button';
import { HStack } from '@astryxdesign/core/HStack';
import { VStack } from '@astryxdesign/core/VStack';
import { useEffect, useImperativeHandle, useRef, useState } from 'react';

import { useCommissionForm } from '../hooks/use-commission-form.js';
import { CommissionFields } from './commission-fields.jsx';

/**
 * "Commission" tab body — inline `isReadOnly`-toggle edit, same
 * convention as `ContractPrivateInfoPanel` (see that component's doc
 * comment for the two call-site conventions this mirrors: standalone with
 * its own bottom action row, or embedded with `hideOwnActions` +
 * `controllerRef`/`onStatusChange` letting the Contract dialog's footer
 * drive it). Replaces the old `ContractCommissionTab` (read-only summary)
 * + a separate `CommissionFormDialog` opened on top of the Contract
 * dialog — editing now happens in place, no second fullscreen dialog
 * popping open.
 *
 * A contract has at most one Commission: `commission == null` means none
 * exists yet, so this panel starts directly in editing mode — there is no
 * "view" state for something that doesn't exist, same idea as the
 * "Thông tin" tab starting in edit mode for a brand-new Contract. `Hủy`
 * while creating just clears the draft (stays in editing, since there is
 * still nothing to fall back to viewing).
 * @param {{
 *   contractId: string,
 *   currency: string,
 *   commission: (import('../types/index.js').Commission & { contractNumber?: string, projectName?: string }) | null,
 *   onAddAnnex?: () => void,
 *   onEditAnnex?: (annex: import('../types/index.js').CommissionAnnex) => void,
 *   onAddPayment?: (commission: import('../types/index.js').Commission) => void,
 *   hideOwnActions?: boolean,
 *   onStatusChange?: (status: { isEditing: boolean, isSubmitting: boolean, submitLabel: string }) => void,
 *   controllerRef?: import('react').Ref<{ startEditing: () => void, cancelEditing: () => void, submit: () => void }>,
 * }} props
 */
export function ContractCommissionPanel({
  contractId,
  currency,
  commission,
  onAddAnnex,
  onEditAnnex,
  onAddPayment,
  hideOwnActions = false,
  onStatusChange,
  controllerRef,
}) {
  const [isEditing, setIsEditing] = useState(!commission);
  const formRef = useRef(/** @type {HTMLFormElement | null} */ (null));
  const form = useCommissionForm({
    contractId,
    commission,
    onSuccess: () => setIsEditing(false),
  });

  const editLabel = commission ? 'Sửa Commission' : 'Tạo Commission';

  function startEditing() {
    setIsEditing(true);
  }

  // While creating (no commission yet) there is no view state to fall
  // back to — clearing the draft is the only thing "Hủy" can mean.
  function cancelEditing() {
    form.reset();
    setIsEditing(!commission);
  }

  useImperativeHandle(
    controllerRef,
    () => ({
      startEditing,
      cancelEditing,
      submit: () => formRef.current?.requestSubmit(),
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- startEditing/cancelEditing close over stable setters/form.reset
    [],
  );

  useEffect(() => {
    onStatusChange?.({
      isEditing,
      isSubmitting: form.isSubmitting,
      submitLabel: isEditing ? form.submitLabel : editLabel,
    });
  }, [isEditing, form.isSubmitting, form.submitLabel, editLabel, onStatusChange]);

  return (
    <form
      ref={formRef}
      onSubmit={(event) => {
        if (!isEditing) {
          event.preventDefault();
          return;
        }
        form.handleSubmit(event);
      }}
    >
      <VStack gap={4} hAlign="stretch">
        {form.submitError ? (
          <Banner status="error" title={form.submitError} container="card" />
        ) : null}

        <CommissionFields
          commission={commission}
          isReadOnly={!isEditing}
          values={form.values}
          setField={form.setField}
          fieldStatuses={form.fieldStatuses}
          isCheckingCode={form.isCheckingCode}
          customers={form.customers}
          currency={currency}
          paymentTermRows={form.paymentTermRows}
          paymentHistoryRows={form.paymentHistoryRows}
          onAddAnnex={onAddAnnex}
          onEditAnnex={onEditAnnex}
          onAddPayment={
            commission ? () => onAddPayment?.(commission) : undefined
          }
        />

        {hideOwnActions ? null : (
          <HStack hAlign="end" gap={2}>
            {isEditing ? (
              <>
                <Button
                  label="Hủy"
                  variant="secondary"
                  type="button"
                  isDisabled={form.isSubmitting}
                  onClick={cancelEditing}
                />
                <Button
                  label={form.submitLabel}
                  type="submit"
                  variant="primary"
                  isLoading={form.isSubmitting}
                />
              </>
            ) : (
              <Button
                label={editLabel}
                variant="secondary"
                type="button"
                onClick={startEditing}
              />
            )}
          </HStack>
        )}
      </VStack>
    </form>
  );
}
