'use client';

import { FormDialog } from '@/shared/components/form-dialog.jsx';
import { useAppToast } from '@/shared/hooks/use-app-toast.js';

import { useCommissionAnnexForm } from '../hooks/use-commission-annex-form.js';
import { CommissionAnnexFields } from './commission-annex-fields.jsx';

/**
 * Create/edit dialog for one `Commission`'s annexes — opened from
 * `ContractExpandedDetails`'s "Commission" tab (`contracts-list.jsx`).
 * Pass `annex` to edit an existing one; omit it to create a new one (its
 * `annexNumber`/`annexCode` are assigned by the backend on success).
 * @param {{
 *   isOpen: boolean,
 *   onOpenChange: (isOpen: boolean) => void,
 *   contractId: string,
 *   annex?: import('../types/index.js').CommissionAnnex | null,
 *   onSuccess?: (annex: import('../types/index.js').CommissionAnnex) => void,
 * }} props
 */
export function CommissionAnnexFormDialog({
  isOpen,
  onOpenChange,
  contractId,
  annex = null,
  onSuccess,
}) {
  const toast = useAppToast();
  const form = useCommissionAnnexForm({
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
      <CommissionAnnexFields
        values={form.values}
        setField={form.setField}
        fieldStatuses={form.fieldStatuses}
      />
    </FormDialog>
  );
}
