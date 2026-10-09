'use client';

import { FormDialog } from '@/shared/components/form-dialog.jsx';

import { subInstallmentSchema } from '../config/child-schemas.js';
import { emptySubInstallment } from '../config/payment-draft.js';
import { useContractChildMutation } from '../hooks/use-contract-children.js';
import { useZodForm } from '../hooks/use-zod-form.js';
import { SubInstallmentFields } from './sub-installment-fields.jsx';

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
function SubInstallmentFormSession({
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
  const { values, setField, fieldStatuses } = form;

  const code =
    sub?.code ??
    `${installment?.number ?? ''}.${(installment?.subInstallments.length ?? 0) + 1}`;

  return (
    <FormDialog
      variant="drawer"
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      title={sub ? `Sửa lần thanh toán ${code}` : `Thêm lần thanh toán ${code}`}
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

/** @param {Parameters<typeof SubInstallmentFormSession>[0]} props */
export function SubInstallmentFormDialog(props) {
  return props.isOpen ? (
    <SubInstallmentFormSession key={props.sub?.id ?? 'new'} {...props} />
  ) : null;
}
