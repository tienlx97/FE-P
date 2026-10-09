'use client';

import { Button } from '@astryxdesign/core/Button';
import { Card } from '@astryxdesign/core/Card';
import { Collapsible } from '@astryxdesign/core/Collapsible';
import { HStack } from '@astryxdesign/core/HStack';
import { Icon } from '@astryxdesign/core/Icon';
import { Text } from '@astryxdesign/core/Text';
import { VStack } from '@astryxdesign/core/VStack';
import { ListChecks, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';

import {
  MetaFormCard,
  MetaFormSection,
} from '@/shared/components/custom/meta/index.js';
import { FormDialog } from '@/shared/components/form-dialog.jsx';
import { TextInput } from '@/shared/components/text-input.jsx';

import { installmentSchema } from '../config/child-schemas.js';
import { formatVnd, subInstallmentAmount } from '../config/money.js';
import {
  emptySubInstallment,
  initialPaymentStage,
} from '../config/payment-draft.js';
import { useContractChildMutation } from '../hooks/use-contract-children.js';
import { useZodForm } from '../hooks/use-zod-form.js';
import { SubInstallmentFields } from './sub-installment-fields.jsx';

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
function InstallmentFormSession({
  contractId,
  isOpen,
  onOpenChange,
  installment,
  nextNumber,
  valueAfterTax,
}) {
  const mutation = useContractChildMutation(contractId);
  const [openIndex, setOpenIndex] = useState(0);
  const initial = () =>
    installment
      ? {
          note: installment.note ?? '',
          subInstallments: /** @type {SubValues[]} */ ([]),
        }
      : initialPaymentStage();
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
  const { values, setField, fieldStatuses } = form;

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
      drawerIcon={ListChecks}
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      title={
        installment
          ? `Sửa đợt thanh toán ${number}`
          : `Thêm đợt thanh toán ${number}`
      }
      subtitle="Một đợt có thể thanh toán một lần hoặc chia thành nhiều lần."
      submitLabel={installment ? 'Lưu thay đổi' : 'Tạo đợt'}
      width={installment ? 480 : 820}
      draft={{ values }}
      isSubmitting={form.isSubmitting}
      submitError={form.submitError || fieldStatuses.subInstallments?.message}
      fieldStatuses={fieldStatuses}
      onValidation={() => {
        const parsed = installmentSchema.safeParse(values);
        if (!parsed.success) {
          const issue = parsed.error.issues.find(
            (item) => item.path[0] === 'subInstallments',
          );
          if (typeof issue?.path[1] === 'number') setOpenIndex(issue.path[1]);
        }
      }}
      onSubmit={form.handleSubmit}
    >
      <VStack gap={4} hAlign="stretch">
        <MetaFormSection
          title="Thông tin đợt thanh toán"
          isTitleUppercase={false}
        >
          <TextInput
            label="Ghi chú của đợt"
            placeholder="Ví dụ: Tạm ứng, nghiệm thu, quyết toán"
            value={values.note}
            onChange={(value) => setField('note', value)}
            isOptional
            status={fieldStatuses.note}
          />
        </MetaFormSection>
        {installment ? null : (
          <MetaFormSection
            title="Các lần thanh toán"
            isTitleUppercase={false}
            meta={`${values.subInstallments.length} lần`}
          >
            <Text color="secondary" size="sm">
              Mặc định một lần thanh toán toàn bộ. Thêm lần khi cần chia nhỏ số
              tiền.
            </Text>
            <MetaFormCard>
              <HStack hAlign="between" gap={3} wrap="wrap">
                <Text weight="semibold">Tổng kế hoạch của đợt</Text>
                <Text weight="bold" color="accent" hasTabularNumbers>
                  {formatVnd(
                    values.subInstallments.reduce(
                      (sum, sub) =>
                        sum +
                        subInstallmentAmount(
                          sub.kind,
                          sub.percent,
                          sub.amount,
                          valueAfterTax,
                        ),
                      0,
                    ),
                  )}{' '}
                  VND
                </Text>
              </HStack>
            </MetaFormCard>
            {values.subInstallments.map((sub, index) => (
              <Card key={index} padding={3}>
                <Collapsible
                  isOpen={openIndex === index}
                  onOpenChange={(open) => setOpenIndex(open ? index : -1)}
                  trigger={
                    <HStack gap={3} hAlign="between" wrap="wrap" width="100%">
                      <Text weight="bold">
                        Lần {index + 1} · {number}.{index + 1}
                      </Text>
                      <Text color="secondary" hasTabularNumbers>
                        {formatVnd(
                          subInstallmentAmount(
                            sub.kind,
                            sub.percent,
                            sub.amount,
                            valueAfterTax,
                          ),
                        )}{' '}
                        VND ·{' '}
                        {sub.status === 'Paid' ? 'Đã thanh toán' : 'Kế hoạch'}
                      </Text>
                    </HStack>
                  }
                >
                  <VStack gap={3} hAlign="stretch">
                    <SubInstallmentFields
                      values={sub}
                      onChange={(field, value) => setSub(index, field, value)}
                      fieldStatuses={fieldStatuses}
                      statusPrefix={`subInstallments.${index}.`}
                      valueAfterTax={valueAfterTax}
                    />
                    {values.subInstallments.length > 1 ? (
                      <HStack hAlign="end">
                        <Button
                          label={`Xoá lần ${index + 1}`}
                          icon={<Icon icon={Trash2} size="sm" />}
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setField(
                              'subInstallments',
                              values.subInstallments.filter(
                                (_, i) => i !== index,
                              ),
                            );
                            setOpenIndex(Math.max(0, index - 1));
                          }}
                        />
                      </HStack>
                    ) : null}
                  </VStack>
                </Collapsible>
              </Card>
            ))}
            <Button
              label="Thêm lần thanh toán"
              icon={<Icon icon={Plus} size="sm" />}
              variant="secondary"
              onClick={() => {
                setOpenIndex(values.subInstallments.length);
                setField('subInstallments', [
                  ...values.subInstallments,
                  emptySubInstallment(),
                ]);
              }}
            />
          </MetaFormSection>
        )}
      </VStack>
    </FormDialog>
  );
}

/** @param {Parameters<typeof InstallmentFormSession>[0]} props */
export function InstallmentFormDialog(props) {
  return props.isOpen ? (
    <InstallmentFormSession key={props.installment?.id ?? 'new'} {...props} />
  ) : null;
}
