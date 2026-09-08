'use client';

import { FormDialog } from '@/shared/components/form-dialog.jsx';
import { useAppToast } from '@/shared/hooks/use-app-toast.js';

import { useContractAnnexForm } from '../hooks/use-contract-annex-form.js';
import { ContractAnnexFields } from './contract-annex-fields.jsx';

/**
 * Create/edit dialog for one `Contract`'s annexes — opened from
 * `ContractExpandedDetails`'s "Phụ lục" tab (`contracts-list.jsx`). Pass
 * `annex` to edit an existing one; omit it to create a new one (its
 * `annexNumber`/`annexCode` are assigned by the backend on success).
 * @param {{
 *   isOpen: boolean,
 *   onOpenChange: (isOpen: boolean) => void,
 *   contractId: string,
 *   annex?: import('../types/index.js').ContractAnnex | null,
 *   onSuccess?: (annex: import('../types/index.js').ContractAnnex) => void,
 * }} props
 */
export function ContractAnnexFormDialog({
  isOpen,
  onOpenChange,
  contractId,
  annex = null,
  onSuccess,
}) {
  const toast = useAppToast();
  const form = useContractAnnexForm({
    contractId,
    annex,
    onSuccess: (savedAnnex) => {
      toast({ body: annex ? 'Đã cập nhật phụ lục.' : 'Đã thêm phụ lục.' });
      onOpenChange(false);
      onSuccess?.(savedAnnex);
    },
  });

  /** @param {boolean} nextIsOpen */
  function handleOpenChange(nextIsOpen) {
    if (!nextIsOpen) form.reset();
    onOpenChange(nextIsOpen);
  }

  return (
    <FormDialog
      isOpen={isOpen}
      onOpenChange={handleOpenChange}
      title={annex ? `Sửa phụ lục ${annex.annexCode}` : 'Thêm phụ lục'}
      submitLabel={annex ? 'Lưu thay đổi' : 'Thêm'}
      width={480}
      draft={{ values: form.values }}
      isSubmitting={form.isSubmitting}
      submitError={form.submitError}
      fieldStatuses={form.fieldStatuses}
      onSubmit={form.handleSubmit}
    >
      <ContractAnnexFields
        values={form.values}
        setField={form.setField}
        fieldStatuses={form.fieldStatuses}
      />
    </FormDialog>
  );
}
