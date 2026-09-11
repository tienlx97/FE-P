'use client';

import { Banner } from '@astryxdesign/core/Banner';
import { Button } from '@astryxdesign/core/Button';
import { HStack } from '@astryxdesign/core/HStack';
import { VStack } from '@astryxdesign/core/VStack';
import { useState } from 'react';

import { useContractPrivateInfoForm } from '../hooks/use-contract-private-info-form.js';
import {
  ContractPrivateInfoFields,
  isPrivateInfoEntirelyEmpty,
} from './contract-private-info-fields.jsx';

/**
 * "BOQ" (private info) body — inline `isReadOnly`-toggle edit, same
 * convention as the "Hồ sơ" tab's `ContractGeneralFields`
 * (`contract-form-dialog.jsx`'s `useContractForm`/`isEditing`) — Xem and
 * Sửa render the exact same `ContractPrivateInfoFields` layout, so the two
 * can never drift apart. Only ever mounted for a caller with
 * `logistics:secret` (`contract-private-info-detail-dialog.jsx`'s only
 * caller gates both the query and the "Mở BOQ" summary card the same way —
 * see `ContractExpandedDetails`'s doc comment, task 3.1).
 *
 * Own its own Hủy/Lưu · Sửa/Nhập action row at the bottom (not top — a
 * stray top button read as misplaced next to a full-page form). Used to
 * also support an embedded, externally-driven mode when Contract's own
 * dialog footer drove this panel directly (pre-task-3.1); that entrypoint
 * is gone now that BOQ only ever opens through the standalone detail
 * dialog, so this only has the one convention left.
 * @param {{
 *   contractId: string,
 *   privateInfo: import('../types/index.js').ContractPrivateInfo,
 *   initialEditing?: boolean,
 * }} props
 */
export function ContractPrivateInfoPanel({
  contractId,
  privateInfo,
  initialEditing = false,
}) {
  const [isEditing, setIsEditing] = useState(initialEditing);
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

  return (
    <form
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
      </VStack>
    </form>
  );
}
