'use client';

import { Button } from '@astryxdesign/core/Button';
import { Card } from '@astryxdesign/core/Card';
import { HStack } from '@astryxdesign/core/HStack';
import { Icon } from '@astryxdesign/core/Icon';
import { Text } from '@astryxdesign/core/Text';
import { VStack } from '@astryxdesign/core/VStack';
import { ListChecks, Plus } from 'lucide-react';

import { MetaFormSection } from '@/shared/components/custom/meta/index.js';
import { FormDialog } from '@/shared/components/form-dialog.jsx';
import { TextArea } from '@/shared/components/text-area.jsx';

import { installmentSchema } from '../config/child-schemas.js';
import { formatVnd, subInstallmentValues } from '../config/money.js';
import {
  emptySubInstallment,
  initialPaymentStage,
  paymentFieldPatch,
  paymentValues,
} from '../config/payment-draft.js';
import { useContractChildMutation } from '../hooks/use-contract-children.js';
import { useZodForm } from '../hooks/use-zod-form.js';
import { PaymentEditTable } from './payment-edit-table.jsx';

/** @typedef {import('../types/index.js').AccountingSubInstallmentFormValues} SubValues */
/** @param {{ contractId: string, isOpen: boolean, onOpenChange: (open: boolean) => void,
 * installment: import('../types/index.js').AccountingInstallment | null, nextNumber: number,
 * contract: import('../types/index.js').AccountingContractSummary }} props */
function InstallmentFormSession({
  contractId,
  isOpen,
  onOpenChange,
  installment,
  nextNumber,
  contract,
}) {
  const mutation = useContractChildMutation(contractId);
  const initial = installment
    ? {
        note: installment.note ?? '',
        subInstallments: installment.subInstallments.map((sub) => ({
          ...paymentValues(sub),
          draftId: sub.id,
        })),
      }
    : {
        ...initialPaymentStage(contract.taxRatePercent),
        subInstallments: initialPaymentStage(
          contract.taxRatePercent,
        ).subInstallments.map((sub) => ({
          ...sub,
          draftId: crypto.randomUUID(),
        })),
      };
  const form = useZodForm({
    initialValues: initial,
    schema: installmentSchema,
    submit: (_parsed, values) =>
      mutation.mutateAsync({
        kind: 'installment',
        note: values.note,
        subInstallments: values.subInstallments,
        id: installment?.id,
        existingSubs: installment?.subInstallments.map((sub, index) => ({
          id: sub.id,
          values: values.subInstallments[index],
        })),
      }),
    onSuccess: () => onOpenChange(false),
  });
  const { values, setField, fieldStatuses } = form;
  /** @template {keyof SubValues} K @param {number} index @param {K} field @param {SubValues[K]} value */
  function setSub(index, field, value) {
    setField(
      'subInstallments',
      values.subInstallments.map((sub, i) =>
        i === index ? { ...sub, ...paymentFieldPatch(sub, field, value) } : sub,
      ),
    );
  }
  const number = installment?.number ?? nextNumber;
  const total = values.subInstallments.reduce(
    (sum, sub) => sum + subInstallmentValues(sub, contract).afterTax,
    0,
  );
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
      width={1120}
      draft={{ values }}
      isSubmitting={form.isSubmitting}
      submitError={form.submitError || fieldStatuses.subInstallments?.message}
      fieldStatuses={fieldStatuses}
      onSubmit={form.handleSubmit}
    >
      <VStack gap={4} hAlign="stretch">
        <MetaFormSection
          title="Các lần thanh toán"
          isTitleUppercase={false}
          meta={`${values.subInstallments.length} lần`}
        >
          <Card padding={4}>
            <HStack hAlign="between" gap={4} wrap="wrap">
              <VStack gap={1}>
                <Text color="secondary" size="sm">
                  Tổng giá trị đợt {number}
                </Text>
                <Text size="xl" weight="bold" color="accent" hasTabularNumbers>
                  {formatVnd(total)} VND
                </Text>
              </VStack>
              <VStack gap={1}>
                <Text color="secondary" size="sm">
                  Giá trị hợp đồng sau thuế
                </Text>
                <Text weight="semibold" hasTabularNumbers>
                  {formatVnd(contract.valueAfterTax)} VND
                </Text>
              </VStack>
            </HStack>
          </Card>
          <HStack hAlign="between" gap={3} wrap="wrap">
            <Text color="secondary" size="sm">
              Mỗi lần thanh toán có tỷ lệ hoặc giá trị trước thuế, thuế, giá trị
              thực tế, trạng thái, ngày thanh toán, điều kiện và ghi chú riêng.
            </Text>
            {installment ? null : (
              <Button
                label="Thêm lần thanh toán"
                icon={<Icon icon={Plus} size="sm" />}
                variant="secondary"
                onClick={() =>
                  setField('subInstallments', [
                    ...values.subInstallments,
                    {
                      ...emptySubInstallment(contract.taxRatePercent),
                      draftId: crypto.randomUUID(),
                    },
                  ])
                }
              />
            )}
          </HStack>
          <PaymentEditTable
            rows={values.subInstallments.map((sub, index) => ({
              id: sub.draftId,
              code:
                installment?.subInstallments[index]?.code ??
                `${number}.${index + 1}`,
              values: sub,
            }))}
            contract={contract}
            onChange={setSub}
            fieldStatuses={fieldStatuses}
            onRemove={
              installment
                ? undefined
                : (index) =>
                    setField(
                      'subInstallments',
                      values.subInstallments.filter((_, i) => i !== index),
                    )
            }
          />
        </MetaFormSection>
        <MetaFormSection
          isBoxed
          title="Ghi chú của đợt"
          isTitleUppercase={false}
        >
          <TextArea
            label="Ghi chú của đợt"
            isLabelHidden
            rows={3}
            value={values.note}
            onChange={(v) => setField('note', v)}
            placeholder="Tạm ứng, nghiệm thu, quyết toán…"
            maxLength={1000}
            status={fieldStatuses.note}
          />
        </MetaFormSection>
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
