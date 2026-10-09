'use client';

import { DateInput } from '@astryxdesign/core/DateInput';
import { Grid } from '@astryxdesign/core/Grid';
import { HStack } from '@astryxdesign/core/HStack';
import { Text } from '@astryxdesign/core/Text';
import { VStack } from '@astryxdesign/core/VStack';

import {
  MetaFormCard,
  MetaFormSection,
} from '@/shared/components/custom/meta/index.js';
import { FormDialog } from '@/shared/components/form-dialog.jsx';
import { FormattedNumberTextInput } from '@/shared/components/formatted-number-text-input.jsx';
import { TextArea } from '@/shared/components/text-area.jsx';
import { TextInput } from '@/shared/components/text-input.jsx';
import { formatDateInputValue } from '@/shared/config/date-input-format.js';

import { invoiceSchema } from '../config/child-schemas.js';
import { nextInvoiceNumber } from '../config/invoice-number.js';
import { formatVnd } from '../config/money.js';
import { useContractChildMutation } from '../hooks/use-contract-children.js';
import { useZodForm } from '../hooks/use-zod-form.js';

/**
 * @param {import('../types/index.js').AccountingInvoice | null} invoice
 * @param {string} suggestedNumber
 * @param {number} remainingToInvoice
 * @returns {import('../types/index.js').AccountingInvoiceFormValues}
 */
function valuesOf(invoice, suggestedNumber, remainingToInvoice) {
  return {
    invoiceNumber: invoice?.invoiceNumber ?? suggestedNumber,
    issuedDate: invoice?.issuedDate ?? '',
    amount:
      invoice?.amount ??
      (remainingToInvoice > 0 ? remainingToInvoice : undefined),
    note: invoice?.note ?? '',
  };
}

/**
 * @param {{
 *   contractId: string,
 *   projectCode: string,
 *   invoices: import('../types/index.js').AccountingInvoice[],
 *   remainingToInvoice: number,
 *   isOpen: boolean,
 *   onOpenChange: (isOpen: boolean) => void,
 *   invoice: import('../types/index.js').AccountingInvoice | null,
 * }} props
 */
function InvoiceFormSession({
  contractId,
  projectCode,
  invoices,
  remainingToInvoice,
  isOpen,
  onOpenChange,
  invoice,
}) {
  const suggestedNumber = nextInvoiceNumber(projectCode, invoices);
  const mutation = useContractChildMutation(contractId);
  const form = useZodForm({
    initialValues: valuesOf(invoice, suggestedNumber, remainingToInvoice),
    schema: invoiceSchema,
    submit: (_parsed, values) =>
      mutation.mutateAsync({ kind: 'invoice', values, id: invoice?.id }),
    onSuccess: () => onOpenChange(false),
  });
  const { values, setField, fieldStatuses } = form;

  return (
    <FormDialog
      variant="drawer"
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      title={invoice ? 'Sửa hoá đơn' : 'Thêm hoá đơn'}
      subtitle={`Công trình ${projectCode}`}
      submitLabel={invoice ? 'Lưu thay đổi' : 'Lưu hoá đơn'}
      width={640}
      draft={{ values }}
      isSubmitting={form.isSubmitting}
      submitError={form.submitError}
      fieldStatuses={fieldStatuses}
      onSubmit={form.handleSubmit}
    >
      <VStack gap={4} hAlign="stretch">
        <MetaFormSection title="Thông tin hoá đơn" isTitleUppercase={false}>
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
          <Text size="sm" color="secondary">
            Số hoá đơn theo mã công trình/HĐ-số thứ tự; có thể điều chỉnh trước
            khi lưu.
          </Text>
        </MetaFormSection>
        <MetaFormSection title="Giá trị xuất hoá đơn" isTitleUppercase={false}>
          <MetaFormCard>
            <HStack hAlign="between" gap={3} wrap="wrap">
              <Text color="secondary">Còn phải xuất hoá đơn</Text>
              <Text weight="bold" hasTabularNumbers>
                {formatVnd(remainingToInvoice)} VND
              </Text>
            </HStack>
          </MetaFormCard>
          <FormattedNumberTextInput
            label="Giá trị (đã gồm thuế)"
            value={values.amount}
            onChange={(value) => setField('amount', value)}
            units="VND"
            isRequired
            status={fieldStatuses.amount}
          />
        </MetaFormSection>
        <MetaFormSection title="Thông tin bổ sung" isTitleUppercase={false}>
          <TextArea
            label="Ghi chú"
            value={values.note}
            onChange={(value) => setField('note', value)}
            isOptional
            maxLength={1000}
            status={fieldStatuses.note}
            statusVariant="tooltip"
          />
        </MetaFormSection>
      </VStack>
    </FormDialog>
  );
}

/** @param {Parameters<typeof InvoiceFormSession>[0]} props */
export function InvoiceFormDialog(props) {
  return props.isOpen ? (
    <InvoiceFormSession key={props.invoice?.id ?? 'new'} {...props} />
  ) : null;
}
