'use client';

import { CheckboxInput } from '@astryxdesign/core/CheckboxInput';
import { DateInput } from '@astryxdesign/core/DateInput';
import { HStack } from '@astryxdesign/core/HStack';
import { Selector } from '@astryxdesign/core/Selector';
import { VStack } from '@astryxdesign/core/VStack';
import { useEffect } from 'react';

import { FormDialog } from '@/shared/components/form-dialog.jsx';
import { FormattedNumberTextInput } from '@/shared/components/formatted-number-text-input.jsx';
import { TextArea } from '@/shared/components/text-area.jsx';
import { formatDateInputValue } from '@/shared/config/date-input-format.js';

import {
  APPENDIX_TYPE_OPTIONS,
  appendixSchema,
} from '../config/child-schemas.js';
import { useContractChildMutation } from '../hooks/use-contract-children.js';
import { useZodForm } from '../hooks/use-zod-form.js';

/**
 * @param {import('../types/index.js').AccountingAppendix | null} appendix
 * @returns {import('../types/index.js').AccountingAppendixFormValues}
 */
function valuesOf(appendix) {
  return {
    type: appendix?.type ?? 'Increase',
    amount:
      appendix && appendix.type !== 'InfoChange' ? appendix.amount : undefined,
    signedDate: appendix?.signedDate ?? '',
    buyerSigned: appendix?.buyerSigned ?? false,
    sellerSigned: appendix?.sellerSigned ?? false,
    note: appendix?.note ?? '',
  };
}

/**
 * @param {{
 *   contractId: string,
 *   isOpen: boolean,
 *   onOpenChange: (isOpen: boolean) => void,
 *   appendix: import('../types/index.js').AccountingAppendix | null,
 * }} props
 */
export function AppendixFormDialog({
  contractId,
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
  const { reset, values, setField, fieldStatuses } = form;

  useEffect(() => {
    if (isOpen) reset(valuesOf(appendix));
    // Reload the values each time the dialog opens on a (possibly other) appendix.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, appendix]);

  const isInfoChange = values.type === 'InfoChange';

  return (
    <FormDialog
      variant="drawer"
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      title={appendix ? 'Sửa phụ lục' : 'Thêm phụ lục'}
      submitLabel={appendix ? 'Lưu' : 'Thêm'}
      width={520}
      draft={{ values }}
      isSubmitting={form.isSubmitting}
      submitError={form.submitError}
      fieldStatuses={fieldStatuses}
      onSubmit={form.handleSubmit}
    >
      <VStack gap={4} hAlign="stretch">
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
        <FormattedNumberTextInput
          label="Số tiền"
          value={isInfoChange ? undefined : values.amount}
          onChange={(value) => setField('amount', value)}
          units="VND"
          isDisabled={isInfoChange}
          isRequired={!isInfoChange}
          description={
            isInfoChange
              ? 'Thay đổi thông tin không làm đổi giá trị hợp đồng'
              : undefined
          }
          status={fieldStatuses.amount}
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
        <HStack gap={4}>
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
