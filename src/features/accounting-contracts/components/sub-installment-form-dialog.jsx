'use client';

import { useEffect } from 'react';

import { FormDialog } from '@/shared/components/form-dialog.jsx';

import { subInstallmentSchema } from '../config/child-schemas.js';
import { useContractChildMutation } from '../hooks/use-contract-children.js';
import { useZodForm } from '../hooks/use-zod-form.js';
import {
  emptySubInstallment,
  SubInstallmentFields,
} from './sub-installment-fields.jsx';

/**
 * @param {import('../types/index.js').AccountingSubInstallment | null} sub
 * @returns {import('../types/index.js').AccountingSubInstallmentFormValues}
 */
function valuesOf(sub) {
  if (!sub) return emptySubInstallment();
  return {
    kind: sub.kind,
    percent: sub.percent ?? undefined,
    amount: sub.kind === 'Quantity' ? sub.amount : undefined,
    condition: sub.condition ?? '',
    paymentDate: sub.paymentDate ?? '',
    status: sub.status,
    note: sub.note ?? '',
  };
}

/**
 * Adds a sub-instalment to an instalment, or edits one (e.g. marks it paid).
 * @param {{
 *   contractId: string,
 *   isOpen: boolean,
 *   onOpenChange: (isOpen: boolean) => void,
 *   installment: import('../types/index.js').AccountingInstallment | null,
 *   sub: import('../types/index.js').AccountingSubInstallment | null,
 *   valueAfterTax: number,
 * }} props
 */
export function SubInstallmentFormDialog({
  contractId,
  isOpen,
  onOpenChange,
  installment,
  sub,
  valueAfterTax,
}) {
  const mutation = useContractChildMutation(contractId);
  const form = useZodForm({
    initialValues: valuesOf(sub),
    schema: subInstallmentSchema,
    submit: (_parsed, values) =>
      mutation.mutateAsync({
        kind: 'sub',
        installmentId: installment?.id ?? '',
        values,
        id: sub?.id,
      }),
    onSuccess: () => onOpenChange(false),
  });
  const { reset, values, setField, fieldStatuses } = form;

  useEffect(() => {
    if (isOpen) reset(valuesOf(sub));
    // Reload the values each time the dialog opens on a (possibly other) sub-instalment.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, sub]);

  const code =
    sub?.code ??
    `${installment?.number ?? ''}.${(installment?.subInstallments.length ?? 0) + 1}`;

  return (
    <FormDialog
      variant="drawer"
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      title={sub ? `Sửa đợt ${code}` : `Thêm đợt ${code}`}
      submitLabel={sub ? 'Lưu' : 'Thêm'}
      width={820}
      draft={{ values }}
      isSubmitting={form.isSubmitting}
      submitError={form.submitError}
      fieldStatuses={fieldStatuses}
      onSubmit={form.handleSubmit}
    >
      <SubInstallmentFields
        values={values}
        onChange={setField}
        fieldStatuses={fieldStatuses}
        valueAfterTax={valueAfterTax}
      />
    </FormDialog>
  );
}
