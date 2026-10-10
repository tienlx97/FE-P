'use client';

import { Banknote } from 'lucide-react';

import { MetaFormSection } from '@/shared/components/custom/meta/index.js';
import { FormDialog } from '@/shared/components/form-dialog.jsx';

import { subInstallmentSchema } from '../config/child-schemas.js';
import {
  emptySubInstallment,
  paymentFieldPatch,
  paymentValues,
} from '../config/payment-draft.js';
import { useContractChildMutation } from '../hooks/use-contract-children.js';
import { useZodForm } from '../hooks/use-zod-form.js';
import { PaymentEditTable } from './payment-edit-table.jsx';

/**
 * @param {import('../types/index.js').AccountingSubInstallment | null} sub
 * @param {number} contractTaxRatePercent A new payment's default rate.
 * @returns {import('../types/index.js').AccountingSubInstallmentFormValues}
 */
function valuesOf(sub, contractTaxRatePercent) {
  return sub ? paymentValues(sub) : emptySubInstallment(contractTaxRatePercent);
}

/**
 * Adds a sub-instalment to an instalment, or edits one (e.g. marks it paid).
 * @param {{
 *   contractId: string,
 *   isOpen: boolean,
 *   onOpenChange: (isOpen: boolean) => void,
 *   installment: import('../types/index.js').AccountingInstallment | null,
 *   sub: import('../types/index.js').AccountingSubInstallment | null,
 *   contract: import('../types/index.js').AccountingContractSummary,
 * }} props
 */
function SubInstallmentFormSession({
  contractId,
  isOpen,
  onOpenChange,
  installment,
  sub,
  contract,
}) {
  const mutation = useContractChildMutation(contractId);
  const form = useZodForm({
    initialValues: valuesOf(sub, contract.taxRatePercent),
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
    `${installment?.number ?? ''}.${Math.max(0, ...(installment?.subInstallments.map((s) => s.number) ?? [])) + 1}`;

  return (
    <FormDialog
      variant="drawer"
      drawerIcon={Banknote}
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      title={sub ? `Sửa lần thanh toán ${code}` : `Thêm lần thanh toán ${code}`}
      submitLabel={sub ? 'Lưu' : 'Thêm'}
      width={1120}
      draft={{ values }}
      isSubmitting={form.isSubmitting}
      submitError={form.submitError}
      fieldStatuses={fieldStatuses}
      onSubmit={form.handleSubmit}
    >
      <MetaFormSection
        isBoxed
        title="Thông tin lần thanh toán"
        isTitleUppercase={false}
      >
        <PaymentEditTable
          rows={[{ id: sub?.id ?? 'new', code, values }]}
          onChange={(_index, field, value) => {
            for (const [key, next] of Object.entries(
              paymentFieldPatch(values, field, value),
            )) {
              setField(/** @type {keyof typeof values} */ (key), next);
            }
          }}
          fieldStatuses={fieldStatuses}
          statusPrefix=""
          contract={contract}
        />
      </MetaFormSection>
    </FormDialog>
  );
}

/** @param {Parameters<typeof SubInstallmentFormSession>[0]} props */
export function SubInstallmentFormDialog(props) {
  return props.isOpen ? (
    <SubInstallmentFormSession key={props.sub?.id ?? 'new'} {...props} />
  ) : null;
}
