'use client';

import { AlertDialog } from '@astryxdesign/core/AlertDialog';
import { useState } from 'react';

/**
 * "Xoá …?" confirmation that keeps the dialog open with the backend's
 * message when the delete is refused (e.g. still used by a contract).
 * @param {{
 *   title: string | null,
 *   onClose: () => void,
 *   onConfirm: () => Promise<{ success: true } | { success: false, message: string }>,
 * }} props
 */
export function ConfirmDeleteDialog({ title, onClose, onConfirm }) {
  const [error, setError] = useState('');

  async function handleAction() {
    const result = await onConfirm();
    if (result.success) {
      setError('');
      onClose();
      return;
    }
    setError(result.message);
  }

  return (
    <AlertDialog
      isOpen={title !== null}
      onOpenChange={(isOpen) => {
        if (!isOpen) {
          setError('');
          onClose();
        }
      }}
      title={title ?? ''}
      description={error || 'Hành động này không thể hoàn tác.'}
      actionLabel="Xoá"
      onAction={handleAction}
    />
  );
}
