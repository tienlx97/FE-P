'use client';

import { DateInput } from '@astryxdesign/core/DateInput';
import { Grid } from '@astryxdesign/core/Grid';
import { VStack } from '@astryxdesign/core/VStack';
import { useEffect } from 'react';

import { FormDialog } from '@/shared/components/form-dialog.jsx';
import { FormattedNumberTextInput } from '@/shared/components/formatted-number-text-input.jsx';
import { TextArea } from '@/shared/components/text-area.jsx';
import { TextInput } from '@/shared/components/text-input.jsx';
import { formatDateInputValue } from '@/shared/config/date-input-format.js';

import { invoiceSchema } from '../config/child-schemas.js';
import { useContractChildMutation } from '../hooks/use-contract-children.js';
import { useZodForm } from '../hooks/use-zod-form.js';

/**
 * @param {import('../types/index.js').AccountingInvoice | null} invoice
 * @returns {import('../types/index.js').AccountingInvoiceFormValues}
 */
function valuesOf(invoice) {
  return {
    invoiceNumber: invoice?.invoiceNumber ?? '',
    issuedDate: invoice?.issuedDate ?? '',
    amount: invoice?.amount,
    note: invoice?.note ?? '',
  };
}

/**
 * @param {{
 *   contractId: string,
 *   isOpen: boolean,
 *   onOpenChange: (isOpen: boolean) => void,
 *   invoice: import('../types/index.js').AccountingInvoice | null,
 * }} props
 */
export function InvoiceFormDialog({
  contractId,
  isOpen,
  onOpenChange,
  invoice,
}) {
  const mutation = useContractChildMutation(contractId);
  const form = useZodForm({
    initialValues: valuesOf(invoice),
    schema: invoiceSchema,
    submit: (_parsed, values) =>
      mutation.mutateAsync({ kind: 'invoice', values, id: invoice?.id }),
    onSuccess: () => onOpenChange(false),
  });
  const { reset, values, setField, fieldStatuses } = form;

  useEffect(() => {
    if (isOpen) reset(valuesOf(invoice));
    // Reload the values each time the dialog opens on a (possibly other) invoice.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, invoice]);

  return (
    <FormDialog
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      title={invoice ? 'Sửa hoá đơn' : 'Thêm hoá đơn'}
      submitLabel={invoice ? 'Lưu' : 'Thêm'}
      width={560}
      draft={{ values }}
      isSubmitting={form.isSubmitting}
      submitError={form.submitError}
      fieldStatuses={fieldStatuses}
      onSubmit={form.handleSubmit}
    >
      <VStack gap={4} hAlign="stretch">
        <Grid columns={{ minWidth: 200, max: 2 }} gap={3}>
          <TextInput
            label="Số hoá đơn"
            value={values.invoiceNumber}
            onChange={(value) => setField('invoiceNumber', value)}
            isRequired
            status={fieldStatuses.invoiceNumber}
            statusVariant="tooltip"
          />
          <DateInput
            label="Ngày xuất"
            value={
              /** @type {import('@astryxdesign/core/Calendar').ISODateString} */ (
                values.issuedDate
              )
            }
            onChange={(value) => setField('issuedDate', value ?? '')}
            format={formatDateInputValue}
            isRequired
            status={fieldStatuses.issuedDate}
            statusVariant="tooltip"
          />
        </Grid>
        <FormattedNumberTextInput
          label="Giá trị (đã gồm thuế)"
          value={values.amount}
          onChange={(value) => setField('amount', value)}
          units="VND"
          isRequired
          status={fieldStatuses.amount}
        />
        <TextArea
          label="Ghi chú"
          value={values.note}
          onChange={(value) => setField('note', value)}
          isOptional
          maxLength={1000}
          status={fieldStatuses.note}
          statusVariant="tooltip"
        />
      </VStack>
    </FormDialog>
  );
}
