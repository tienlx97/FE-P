'use client';

import { CheckboxInput } from '@astryxdesign/core/CheckboxInput';
import { DateInput } from '@astryxdesign/core/DateInput';
import { Grid } from '@astryxdesign/core/Grid';
import { HStack } from '@astryxdesign/core/HStack';
import { Selector } from '@astryxdesign/core/Selector';
import { Text } from '@astryxdesign/core/Text';
import { VStack } from '@astryxdesign/core/VStack';
import { Paperclip } from 'lucide-react';

import { MetaFormSection } from '@/shared/components/custom/meta/index.js';
import { FormDialog } from '@/shared/components/form-dialog.jsx';
import { FormattedNumberTextInput } from '@/shared/components/formatted-number-text-input.jsx';
import { TextArea } from '@/shared/components/text-area.jsx';
import { formatDateInputValue } from '@/shared/config/date-input-format.js';

import {
  APPENDIX_TYPE_OPTIONS,
  appendixSchema,
} from '../config/child-schemas.js';
import { valueAfterTax } from '../config/money.js';
import { useContractChildMutation } from '../hooks/use-contract-children.js';
import { useZodForm } from '../hooks/use-zod-form.js';

/**
 * @param {import('../types/index.js').AccountingAppendix | null} appendix
 * @returns {import('../types/index.js').AccountingAppendixFormValues}
 */
function valuesOf(appendix) {
  return {
    type: appendix?.type ?? 'Increase',
    valueBeforeTax:
      appendix && appendix.type !== 'InfoChange'
        ? appendix.valueBeforeTax
        : undefined,
    signedDate: appendix?.signedDate ?? '',
    buyerSigned: appendix?.buyerSigned ?? false,
    sellerSigned: appendix?.sellerSigned ?? false,
    note: appendix?.note ?? '',
  };
}

/**
 * @param {{
 *   contractId: string,
 *   taxRatePercent: number,
 *   isOpen: boolean,
 *   onOpenChange: (isOpen: boolean) => void,
 *   appendix: import('../types/index.js').AccountingAppendix | null,
 * }} props
 */
function AppendixFormSession({
  contractId,
  taxRatePercent,
  isOpen,
  onOpenChange,
  appendix,
}) {
  const mutation = useContractChildMutation(contractId);
  const form = useZodForm({
    initialValues: valuesOf(appendix),
    schema: appendixSchema,
    submit: (_parsed, values) =>
      mutation.mutateAsync({ kind: 'appendix', values, id: appendix?.id }),
    onSuccess: () => onOpenChange(false),
  });
  const { values, setField, fieldStatuses } = form;

  const isInfoChange = values.type === 'InfoChange';
  // Preview of the backend's value after tax (contract tax rate).
  const afterTax = isInfoChange
    ? undefined
    : valueAfterTax(values.valueBeforeTax, taxRatePercent);

  return (
    <FormDialog
      variant="drawer"
      drawerIcon={Paperclip}
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      title={appendix ? 'Sửa phụ lục' : 'Thêm phụ lục'}
      submitLabel={appendix ? 'Lưu' : 'Thêm'}
      width={640}
      draft={{ values }}
      isSubmitting={form.isSubmitting}
      submitError={form.submitError}
      fieldStatuses={fieldStatuses}
      onSubmit={form.handleSubmit}
    >
      <VStack gap={4} hAlign="stretch">
        <MetaFormSection
          isBoxed
          title="Thông tin phụ lục"
          isTitleUppercase={false}
        >
          <Grid columns={{ minWidth: 220, max: 2 }} gap={3}>
            <Selector
              label="Loại phụ lục"
              value={values.type}
              onChange={(value) =>
                setField(
                  'type',
                  /** @type {import('../types/index.js').AppendixType} */ (
                    value ?? 'Increase'
                  ),
                )
              }
              options={APPENDIX_TYPE_OPTIONS}
              isRequired
              status={fieldStatuses.type}
              statusVariant="tooltip"
            />
            <DateInput
              label="Ngày ký"
              value={
                /** @type {import('@astryxdesign/core/Calendar').ISODateString} */ (
                  values.signedDate
                )
              }
              onChange={(value) => setField('signedDate', value ?? '')}
              format={formatDateInputValue}
              isRequired
              status={fieldStatuses.signedDate}
              statusVariant="tooltip"
            />
          </Grid>
          <Grid columns={{ minWidth: 220, max: 2 }} gap={3}>
            <FormattedNumberTextInput
              label="Giá trị trước thuế"
              value={isInfoChange ? undefined : values.valueBeforeTax}
              onChange={(value) => setField('valueBeforeTax', value)}
              units="VND"
              isDisabled={isInfoChange}
              isRequired={!isInfoChange}
              description={
                isInfoChange
                  ? 'Thay đổi thông tin không làm đổi giá trị hợp đồng'
                  : undefined
              }
              status={fieldStatuses.valueBeforeTax}
            />
            <FormattedNumberTextInput
              label="Giá trị sau thuế"
              value={afterTax}
              onChange={() => {}}
              units="VND"
              isDisabled
              description={`Tự tính theo thuế ${taxRatePercent}% của hợp đồng`}
            />
          </Grid>
        </MetaFormSection>
        <MetaFormSection isBoxed title="Tình trạng ký" isTitleUppercase={false}>
          <Text size="sm" color="secondary">
            Phụ lục tăng / giảm được tính vào quyết toán khi cả hai bên đã ký.
          </Text>
          <HStack gap={4} wrap="wrap">
            <CheckboxInput
              label="Bên mua đã ký"
              value={values.buyerSigned}
              onChange={(checked) => setField('buyerSigned', checked)}
            />
            <CheckboxInput
              label="Bên bán đã ký"
              value={values.sellerSigned}
              onChange={(checked) => setField('sellerSigned', checked)}
            />
          </HStack>
        </MetaFormSection>
        <MetaFormSection
          isBoxed
          title="Nội dung bổ sung"
          isTitleUppercase={false}
        >
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

/** @param {Parameters<typeof AppendixFormSession>[0]} props */
export function AppendixFormDialog(props) {
  return props.isOpen ? (
    <AppendixFormSession key={props.appendix?.id ?? 'new'} {...props} />
  ) : null;
}
