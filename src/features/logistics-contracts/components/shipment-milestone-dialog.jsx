'use client';

import { Button } from '@astryxdesign/core/Button';
import { DateInput } from '@astryxdesign/core/DateInput';
import { HStack } from '@astryxdesign/core/HStack';
import { Icon } from '@astryxdesign/core/Icon';
import { Text } from '@astryxdesign/core/Text';
import { VStack } from '@astryxdesign/core/VStack';
import { Undo2 } from 'lucide-react';
import { useState } from 'react';

import { FormDialog } from '@/shared/components/form-dialog.jsx';
import { TextArea } from '@/shared/components/text-area.jsx';
import { formatDateInputValue } from '@/shared/config/date-input-format.js';
import { useAppToast } from '@/shared/hooks/use-app-toast.js';

import { useShipmentMilestoneMutations } from '../hooks/use-shipment-journey-query.js';

/** Local calendar date as ISO "YYYY-MM-DD". */
function todayIso() {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${now.getFullYear()}-${month}-${day}`;
}

/**
 * Confirms a journey milestone by hand on its actual date (or re-dates /
 * reopens one already confirmed). The backend keeps the confirmation
 * next to the status and shows the furthest of both.
 * @param {{
 *   isOpen: boolean,
 *   onOpenChange: (isOpen: boolean) => void,
 *   contractId: string,
 *   shipmentId: string,
 *   step: import('../types/index.js').ShipmentJourneyStep,
 * }} props
 */
export function ShipmentMilestoneDialog({
  isOpen,
  onOpenChange,
  contractId,
  shipmentId,
  step,
}) {
  const toast = useAppToast();
  const { confirm, reopen } = useShipmentMilestoneMutations(
    contractId,
    shipmentId,
  );
  const [values, setValues] = useState({
    completedOn: step.completedOn ?? todayIso(),
    note: step.note ?? '',
  });
  const [submitError, setSubmitError] = useState('');

  /** @param {import('react').FormEvent<HTMLFormElement>} event */
  async function handleSubmit(event) {
    event.preventDefault();
    if (!values.completedOn) {
      setSubmitError('Vui lòng chọn ngày hoàn thành');
      return;
    }
    const result = await confirm.mutateAsync({
      milestone: step.milestone,
      ...values,
    });
    if (!result.success) {
      setSubmitError(result.message);
      return;
    }
    toast({ body: `Đã xác nhận mốc "${step.label}".` });
    onOpenChange(false);
  }

  async function handleReopen() {
    const result = await reopen.mutateAsync(step.milestone);
    if (!result.success) {
      setSubmitError(result.message);
      return;
    }
    toast({ body: `Đã bỏ xác nhận mốc "${step.label}".` });
    onOpenChange(false);
  }

  return (
    <FormDialog
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      title={
        step.isConfirmed ? 'Sửa mốc hành trình' : 'Xác nhận mốc hành trình'
      }
      subtitle={step.label}
      submitLabel={step.isConfirmed ? 'Lưu' : 'Xác nhận hoàn thành'}
      width={480}
      draft={values}
      isSubmitting={confirm.isPending || reopen.isPending}
      submitError={submitError}
      onSubmit={handleSubmit}
    >
      <VStack gap={4} hAlign="stretch">
        <DateInput
          label="Ngày hoàn thành thực tế"
          value={
            /** @type {import('@astryxdesign/core/Calendar').ISODateString} */ (
              values.completedOn || null
            )
          }
          onChange={(value) =>
            setValues((current) => ({ ...current, completedOn: value ?? '' }))
          }
          format={formatDateInputValue}
          isRequired
        />
        <TextArea
          label="Ghi chú"
          value={values.note}
          onChange={(value) =>
            setValues((current) => ({ ...current, note: value }))
          }
          isOptional
          maxLength={500}
        />
        {step.isConfirmed ? (
          <HStack hAlign="between" vAlign="center" gap={3} wrap="wrap">
            <Text size="sm" color="secondary">
              Bỏ xác nhận để mốc quay về theo tình trạng lô hàng.
            </Text>
            <Button
              label="Bỏ xác nhận"
              variant="secondary"
              size="sm"
              icon={<Icon icon={Undo2} size="sm" />}
              isDisabled={reopen.isPending}
              onClick={handleReopen}
            />
          </HStack>
        ) : null}
      </VStack>
    </FormDialog>
  );
}
