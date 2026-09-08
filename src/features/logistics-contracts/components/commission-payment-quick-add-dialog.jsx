'use client';

import { FormDialog } from '@/shared/components/form-dialog.jsx';
import { useAppToast } from '@/shared/hooks/use-app-toast.js';

import { useCommissionPaymentQuickAddForm } from '../hooks/use-commission-payment-quick-add-form.js';
import { CommissionPaymentFields } from './commission-payment-fields.jsx';

/**
 * "Thêm nhanh" — appends one payment to a Commission's "Lịch sử thanh
 * toán" without opening the full `CommissionFormDialog`, same idiom as
 * `CommissionAnnexFormDialog`'s standalone "Thêm phụ lục". Requires the
 * full `commission` (not just its id) since the update it sends resends
 * every other field unchanged — see `useCommissionPaymentQuickAddForm`.
 * @param {{
 *   isOpen: boolean,
 *   onOpenChange: (isOpen: boolean) => void,
 *   contractId: string,
 *   commission: import('../types/index.js').Commission,
 *   currency: string,
 *   onSuccess?: (commission: import('../types/index.js').Commission) => void,
 * }} props
 */
export function CommissionPaymentQuickAddDialog({
  isOpen,
  onOpenChange,
  contractId,
  commission,
  currency,
  onSuccess,
}) {
  const toast = useAppToast();
  const form = useCommissionPaymentQuickAddForm({
    contractId,
    commission,
    onSuccess: (saved) => {
      toast({ body: 'Đã thêm lần thanh toán.' });
      onOpenChange(false);
      onSuccess?.(saved);
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
      title="Thêm lần thanh toán"
      submitLabel="Thêm thanh toán"
      width={480}
      draft={form.values}
      isSubmitting={form.isSubmitting}
      submitError={form.submitError}
      fieldStatuses={form.fieldStatuses}
      onSubmit={form.handleSubmit}
    >
      <CommissionPaymentFields
        values={form.values}
        setField={form.setField}
        fieldStatuses={form.fieldStatuses}
        currency={currency}
      />
    </FormDialog>
  );
}
