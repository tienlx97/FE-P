'use client';

import { Banner } from '@astryxdesign/core/Banner';
import { Button } from '@astryxdesign/core/Button';
import { HStack } from '@astryxdesign/core/HStack';
import { VStack } from '@astryxdesign/core/VStack';
import { useEffect, useImperativeHandle, useRef, useState } from 'react';

import { useContractPrivateInfoForm } from '../hooks/use-contract-private-info-form.js';
import {
  ContractPrivateInfoFields,
  isPrivateInfoEntirelyEmpty,
} from './contract-private-info-fields.jsx';

/**
 * "Thông tin private" tab body — inline `isReadOnly`-toggle edit, same
 * convention as the "Thông tin" tab's `ContractGeneralFields`
 * (`contract-form-dialog.jsx`'s `useContractForm`/`isEditing`), not the
 * separate read-only-summary + dialog pair Commission/Shipment/Payment
 * Schedule use — Xem and Sửa render the exact same `ContractPrivateInfoFields`
 * layout, so the two can never drift apart. Only mounted for a caller with
 * `logistics:secret` (`contract-form-dialog.jsx` hides the tab,
 * `contract-expanded-details.jsx` gates the query).
 *
 * Two call sites, two footer conventions:
 * - Standalone (the BOQ list's detail dialog): renders its own Hủy/Lưu ·
 *   Sửa/Nhập action row *below* the fields (bottom, not top — a stray top
 *   button read as misplaced next to a full-page form).
 * - Embedded in the Contract dialog's "Thông tin private" tab: that dialog
 *   already has a persistent footer with a "Sửa hợp đồng" action
 *   (`contract-form-dialog.jsx`) — a second, tab-local edit button was
 *   redundant there. `hideOwnActions` suppresses this panel's own row, and
 *   `controllerRef` + `onStatusChange` let the dialog's footer drive
 *   editing/submit for whichever tab is active instead. `controllerRef` is
 *   a plain prop (an object ref via `useImperativeHandle`), not JSX
 *   `ref=` — this stays a regular function component, not `forwardRef`
 *   (this codebase's JSDoc/checkJs setup can't infer `forwardRef` prop
 *   types).
 * @param {{
 *   contractId: string,
 *   privateInfo: import('../types/index.js').ContractPrivateInfo,
 *   initialEditing?: boolean,
 *   hideOwnActions?: boolean,
 *   onStatusChange?: (status: { isEditing: boolean, isSubmitting: boolean, submitLabel: string }) => void,
 *   controllerRef?: import('react').Ref<{ startEditing: () => void, cancelEditing: () => void, submit: () => void }>,
 * }} props
 */
export function ContractPrivateInfoPanel({
  contractId,
  privateInfo,
  initialEditing = false,
  hideOwnActions = false,
  onStatusChange,
  controllerRef,
}) {
  const [isEditing, setIsEditing] = useState(initialEditing);
  const formRef = useRef(/** @type {HTMLFormElement | null} */ (null));
  const form = useContractPrivateInfoForm({
    contractId,
    privateInfo,
    onSuccess: () => setIsEditing(false),
  });

  const editLabel = isPrivateInfoEntirelyEmpty(privateInfo)
    ? 'Nhập Thông tin private'
    : 'Sửa Thông tin private';

  function startEditing() {
    setIsEditing(true);
  }

  function cancelEditing() {
    form.reset();
    setIsEditing(false);
  }

  // Lets an external footer (the Contract dialog's) drive this panel
  // without hoisting its form state — `requestSubmit()` runs the same
  // `onSubmit` validation/mutation path a click on the panel's own submit
  // button would.
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

        <ContractPrivateInfoFields
          isReadOnly={!isEditing}
          values={form.values}
          setField={form.setField}
          fieldStatuses={form.fieldStatuses}
          logisticsTotal={privateInfo.logisticsTotal}
          volumeDeclaration={privateInfo.volumeDeclaration}
          extraFieldRows={form.extraFieldRows}
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
