'use client';

import { useState } from 'react';

import { FormDialog } from '@/shared/components/form-dialog.jsx';

import { useCommissionForm } from '../hooks/use-commission-form.js';
import { CommissionFields } from './commission-fields.jsx';

/**
 * Create/edit dialog for one `Contract`'s `Commission` — opened from
 * `ContractExpandedDetails`'s "Commission" tab (`contracts-list.jsx`).
 * A contract has at most one, so pass `commission` to edit the
 * existing one; omit it to create the first (and only) one.
 * @param {{
 *   isOpen: boolean,
 *   initialMode?: 'view' | 'edit',
 *   viewContent?: import('react').ReactNode | ((tab: string) => import('react').ReactNode),
 *   onOpenChange: (isOpen: boolean) => void,
 *   contractId: string,
 *   currency: string,
 *   commission?: import('../types/index.js').Commission | null,
 *   onSuccess?: (commission: import('../types/index.js').Commission) => void,
 * }} props
 */
export function CommissionFormDialog({
  isOpen,
  initialMode = 'edit',
  viewContent,
  onOpenChange,
  contractId,
  currency,
  commission = null,
  onSuccess,
}) {
  const [mode, setMode] = useState(initialMode);
  const isViewing = mode === 'view' && Boolean(commission);
  const form = useCommissionForm({
    contractId,
    commission,
    onSuccess: (saved) => {
      onOpenChange(false);
      onSuccess?.(saved);
    },
  });

  return (
    <FormDialog
      isOpen={isOpen}
      isReadOnly={isViewing}
      onEdit={() => {
        form.reset();
        setMode('edit');
      }}
      onOpenChange={onOpenChange}
      title={isViewing ? `Commission · ${commission?.code}` : form.title}
      submitLabel={form.submitLabel}
      width={720}
      variant="fullscreen"
      draft={{
        values: form.values,
        paymentTerms: form.paymentTermRows.rows,
        payments: form.paymentHistoryRows.rows,
      }}
      isSubmitting={form.isSubmitting}
      submitError={form.submitError}
      fieldStatuses={form.fieldStatuses}
      onSubmit={form.handleSubmit}
    >
      {isViewing ? (
        typeof viewContent === 'function' ? (
          viewContent('info')
        ) : (
          viewContent
        )
      ) : (
        <CommissionFields
          values={form.values}
          setField={form.setField}
          fieldStatuses={form.fieldStatuses}
          customers={form.customers}
          currency={currency}
          paymentTermRows={form.paymentTermRows}
          paymentHistoryRows={form.paymentHistoryRows}
        />
      )}
    </FormDialog>
  );
}
