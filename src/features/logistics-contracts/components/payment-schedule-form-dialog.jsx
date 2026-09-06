'use client';

import { FormDialog } from '@/shared/components/form-dialog.jsx';

import { usePaymentScheduleForm } from '../hooks/use-payment-schedule-form.js';
import { PaymentScheduleFields } from './payment-schedule-fields.jsx';

/**
 * Create/edit dialog for one `Contract`'s payment schedules — opened from
 * `ContractExpandedDetails`'s "Thông tin" tab (`contracts-list.jsx`). Pass
 * `schedule` to edit an existing one; omit it to create a new one (its
 * `paymentNumber`/`paymentCode` are assigned by the backend on success).
 * @param {{
 *   isOpen: boolean,
 *   onOpenChange: (isOpen: boolean) => void,
 *   contractId: string,
 *   schedule?: import('../types/index.js').PaymentSchedule | null,
 *   onSuccess?: (schedule: import('../types/index.js').PaymentSchedule) => void,
 * }} props
 */
export function PaymentScheduleFormDialog({
  isOpen,
  onOpenChange,
  contractId,
  schedule = null,
  onSuccess,
}) {
  const form = usePaymentScheduleForm({
    contractId,
    schedule,
    onSuccess: (savedSchedule) => {
      onOpenChange(false);
      onSuccess?.(savedSchedule);
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
      title={
        schedule
          ? `Sửa đợt thanh toán ${schedule.paymentCode}`
          : 'Thêm đợt thanh toán'
      }
      submitLabel={schedule ? 'Lưu thay đổi' : 'Thêm'}
      width={480}
      draft={{ values: form.values }}
      isSubmitting={form.isSubmitting}
      submitError={form.submitError}
      fieldStatuses={form.fieldStatuses}
      onSubmit={form.handleSubmit}
    >
      <PaymentScheduleFields
        values={form.values}
        setField={form.setField}
        fieldStatuses={form.fieldStatuses}
      />
    </FormDialog>
  );
}
