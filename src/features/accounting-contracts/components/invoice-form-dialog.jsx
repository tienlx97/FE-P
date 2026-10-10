'use client';

import { DateInput } from '@astryxdesign/core/DateInput';
import { Grid } from '@astryxdesign/core/Grid';
import { HStack } from '@astryxdesign/core/HStack';
import { Text } from '@astryxdesign/core/Text';
import { VStack } from '@astryxdesign/core/VStack';
import { ReceiptText } from 'lucide-react';

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
import { invoiceFormValues } from '../config/edit-values.js';
import { formatVnd, valueAfterTax } from '../config/money.js';
import { useContractChildMutation } from '../hooks/use-contract-children.js';
import { useZodForm } from '../hooks/use-zod-form.js';
import { ComputedValueCard } from './computed-value-card.jsx';

/**
 * @param {{
 *   contractId: string,
 *   projectCode: string,
 *   remainingToInvoice: number,
 *   contractTaxRatePercent: number,
 *   isOpen: boolean,
 *   onOpenChange: (isOpen: boolean) => void,
 *   invoice: import('../types/index.js').AccountingInvoice | null,
 * }} props
 */
function InvoiceFormSession({
  contractId,
  projectCode,
  remainingToInvoice,
  contractTaxRatePercent,
  isOpen,
  onOpenChange,
  invoice,
}) {
  const mutation = useContractChildMutation(contractId);
  const form = useZodForm({
    initialValues: invoiceFormValues(invoice, contractTaxRatePercent),
    schema: invoiceSchema,
    submit: (_parsed, values) =>
      mutation.mutateAsync({ kind: 'invoice', values, id: invoice?.id }),
    onSuccess: () => onOpenChange(false),
  });
  const { values, setField, fieldStatuses } = form;
  const afterTax = valueAfterTax(values.valueBeforeTax, values.taxRatePercent);

  return (
    <FormDialog
      variant="drawer"
      drawerIcon={ReceiptText}
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      title={invoice ? 'Sửa hoá đơn' : 'Thêm hoá đơn'}
      subtitle={`Công trình ${projectCode}`}
      submitLabel={invoice ? 'Lưu thay đổi' : 'Lưu hoá đơn'}
      width={720}
      draft={{ values }}
      isSubmitting={form.isSubmitting}
      submitError={form.submitError}
      fieldStatuses={fieldStatuses}
      onSubmit={form.handleSubmit}
    >
      <VStack gap={4} hAlign="stretch">
        <MetaFormSection
          isBoxed
          title="Thông tin hoá đơn"
          isTitleUppercase={false}
        >
          <Grid columns={2} gap={4}>
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
        </MetaFormSection>
        <MetaFormSection
          isBoxed
          title="Giá trị xuất hoá đơn"
          isTitleUppercase={false}
        >
          <MetaFormCard>
            <HStack hAlign="between" gap={3} wrap="wrap">
              <Text color="secondary">Còn phải xuất hoá đơn</Text>
              <Text weight="bold" hasTabularNumbers>
                {formatVnd(remainingToInvoice)} VND
              </Text>
            </HStack>
          </MetaFormCard>
          <Grid columns={2} gap={4}>
            <FormattedNumberTextInput
              label="Giá trị trước thuế"
              value={values.valueBeforeTax}
              onChange={(value) => setField('valueBeforeTax', value)}
              units="VND"
              isRequired
              status={fieldStatuses.valueBeforeTax}
            />
            <FormattedNumberTextInput
              label="Thuế"
              value={values.taxRatePercent}
              onChange={(value) => setField('taxRatePercent', value)}
              units="%"
              isRequired
              status={fieldStatuses.taxRatePercent}
            />
          </Grid>
          <Text color="secondary" size="sm">
            Thuế mặc định theo hợp đồng ({contractTaxRatePercent}%).
          </Text>
          <ComputedValueCard
            label="Giá trị sau thuế"
            computed={afterTax}
            typed={values.valueAfterTax}
            onChange={(value) => setField('valueAfterTax', value)}
            hint={
              afterTax === undefined
                ? 'Nhập giá trị trước thuế để tính'
                : `Tự tính theo thuế ${values.taxRatePercent ?? 0}%`
            }
          />
        </MetaFormSection>
        <MetaFormSection
          isBoxed
          title="Thông tin bổ sung"
          isTitleUppercase={false}
        >
          <TextArea
            label="Ghi chú"
            rows={3}
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
