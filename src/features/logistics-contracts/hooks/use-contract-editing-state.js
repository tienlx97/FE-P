'use client';
import { useId, useState } from 'react';

import { useAppToast } from '@/shared/hooks/use-app-toast.js';

import { useContractForm } from './use-contract-form.js';

/**
 * Xem/Sửa-at-place state for one Contract — `isEditing`/discard-confirm/
 * `useContractForm` wiring, shared by `ContractFormDialog` (dialog chrome)
 * and `ContractDetailWorkspace` (page chrome, `/logistics/contract/[id]`)
 * so both stay behaviorally identical instead of drifting.
 * `onRequestClose` is dialog-only (the "Đóng"/header-X action, and the
 * create-only `contract == null` case); the page never calls
 * `requestExit('close')` since there is no such affordance there.
 * @param {{
 *   contract?: import('../types/index.js').Contract | null,
 *   initialMode?: 'view' | 'edit',
 *   onSuccess: (contract: import('../types/index.js').Contract) => void,
 *   onRequestClose?: () => void,
 * }} params
 */
export function useContractEditingState({
  contract = null,
  initialMode = 'view',
  onSuccess,
  onRequestClose,
}) {
  const [isEditing, setIsEditing] = useState(
    !contract || initialMode === 'edit',
  );
  const [discardAction, setDiscardAction] = useState(
    /** @type {'close' | 'cancel' | null} */ (null),
  );
  const toast = useAppToast();
  const form = useContractForm({
    contract,
    onSuccess: (saved) => {
      toast({ body: contract ? 'Đã cập nhật hợp đồng.' : 'Đã tạo hợp đồng.' });
      // Flip out of edit mode here instead of relying on a remount — the
      // caller keeps this hook's identity stable across save (same
      // `sessionKey`/no `key` change), see `ContractFormDialog`.
      setIsEditing(false);
      onSuccess(saved);
    },
  });
  const { isDirty, isSubmitting } = form;
  const formId = useId();

  /** @param {'close' | 'cancel'} action */
  function finish(action) {
    if (action === 'close' || !contract) {
      onRequestClose?.();
      return;
    }
    // Discard the draft back to the last-saved baseline and flip out of
    // edit mode — nothing remounts to do this implicitly.
    form.reset();
    setIsEditing(false);
  }

  /** @param {'close' | 'cancel'} action */
  function requestExit(action) {
    if (isSubmitting) return;
    if (isEditing && isDirty) {
      setDiscardAction(action);
    } else {
      finish(action);
    }
  }

  return {
    form,
    formId,
    isEditing,
    setIsEditing,
    discardAction,
    setDiscardAction,
    finish,
    requestExit,
  };
}
