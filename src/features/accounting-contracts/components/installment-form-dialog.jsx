'use client';

import { Button } from '@astryxdesign/core/Button';
import { Divider } from '@astryxdesign/core/Divider';
import { HStack } from '@astryxdesign/core/HStack';
import { Icon } from '@astryxdesign/core/Icon';
import { IconButton } from '@astryxdesign/core/IconButton';
import { Text } from '@astryxdesign/core/Text';
import { VStack } from '@astryxdesign/core/VStack';
import { Plus, Trash2 } from 'lucide-react';
import { useEffect } from 'react';

import { FormDialog } from '@/shared/components/form-dialog.jsx';
import { TextInput } from '@/shared/components/text-input.jsx';

import { installmentSchema } from '../config/child-schemas.js';
import { useContractChildMutation } from '../hooks/use-contract-children.js';
import { useZodForm } from '../hooks/use-zod-form.js';
import {
  emptySubInstallment,
  SubInstallmentFields,
} from './sub-installment-fields.jsx';

/** @typedef {import('../types/index.js').AccountingSubInstallmentFormValues} SubValues */

/**
 * New "đợt" with its sub-instalments (`nextNumber`.1, .2…), or — given an
 * `installment` — only its note (sub-instalments are edited one by one).
 * @param {{
 *   contractId: string,
 *   isOpen: boolean,
 *   onOpenChange: (isOpen: boolean) => void,
 *   installment: import('../types/index.js').AccountingInstallment | null,
 *   nextNumber: number,
 *   valueAfterTax: number,
 * }} props
 */
export function InstallmentFormDialog({
  contractId,
  isOpen,
  onOpenChange,
  installment,
  nextNumber,
  valueAfterTax,
}) {
  const mutation = useContractChildMutation(contractId);
  const initial = () => ({
    note: installment?.note ?? '',
    subInstallments: installment ? [] : [emptySubInstallment()],
  });
  const form = useZodForm({
    initialValues: initial(),
    schema: installment
      ? installmentSchema.pick({ note: true })
      : installmentSchema,
    submit: (_parsed, values) =>
      mutation.mutateAsync({
        kind: 'installment',
        note: values.note,
        subInstallments: values.subInstallments,
        id: installment?.id,
      }),
    onSuccess: () => onOpenChange(false),
  });
  const { reset, values, setField, fieldStatuses } = form;

  useEffect(() => {
    if (isOpen) reset(initial());
    // Reload the values each time the dialog opens on a (possibly other) instalment.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, installment]);

  /**
   * @template {keyof SubValues} K
   * @param {number} index @param {K} field @param {SubValues[K]} value
   */
  function setSub(index, field, value) {
    setField(
      'subInstallments',
      values.subInstallments.map((sub, i) =>
        i === index ? { ...sub, [field]: value } : sub,
      ),
    );
  }

  const number = installment?.number ?? nextNumber;

  return (
    <FormDialog
      variant="drawer"
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      title={installment ? `Sửa đợt ${number}` : `Thêm đợt ${number}`}
      submitLabel={installment ? 'Lưu' : 'Thêm'}
      width={installment ? 480 : 820}
      draft={{ values }}
      isSubmitting={form.isSubmitting}
      submitError={form.submitError || fieldStatuses.subInstallments?.message}
      fieldStatuses={fieldStatuses}
      onSubmit={form.handleSubmit}
    >
      <VStack gap={4} hAlign="stretch">
        <TextInput
          label="Ghi chú của đợt"
          value={values.note}
          onChange={(value) => setField('note', value)}
          isOptional
          status={fieldStatuses.note}
          statusVariant="tooltip"
        />
        {values.subInstallments.map((sub, index) => (
          <VStack key={index} gap={2} hAlign="stretch">
            <Divider />
            <HStack hAlign="between" vAlign="center">
              <Text weight="semibold">
                Đợt {number}.{index + 1}
              </Text>
              {values.subInstallments.length > 1 ? (
                <IconButton
                  label={`Bỏ đợt ${number}.${index + 1}`}
                  tooltip="Bỏ đợt con"
                  icon={<Icon icon={Trash2} size="sm" />}
                  variant="ghost"
                  size="sm"
                  onClick={() =>
                    setField(
                      'subInstallments',
                      values.subInstallments.filter((_, i) => i !== index),
                    )
                  }
                />
              ) : null}
            </HStack>
            <SubInstallmentFields
              values={sub}
              onChange={(field, value) => setSub(index, field, value)}
              fieldStatuses={fieldStatuses}
              statusPrefix={`subInstallments.${index}.`}
              valueAfterTax={valueAfterTax}
            />
          </VStack>
        ))}
        {installment ? null : (
          <HStack>
            <Button
              label="Thêm đợt con"
              icon={<Icon icon={Plus} size="sm" />}
              variant="secondary"
              size="sm"
              onClick={() =>
                setField('subInstallments', [
                  ...values.subInstallments,
                  emptySubInstallment(),
                ])
              }
            />
          </HStack>
        )}
      </VStack>
    </FormDialog>
  );
}
