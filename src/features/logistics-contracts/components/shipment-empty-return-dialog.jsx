'use client';

import { DateInput } from '@astryxdesign/core/DateInput';
import { HStack } from '@astryxdesign/core/HStack';
import { StackItem } from '@astryxdesign/core/Stack';
import { Text } from '@astryxdesign/core/Text';
import { VStack } from '@astryxdesign/core/VStack';
import { useState } from 'react';

import { FormDialog } from '@/shared/components/form-dialog.jsx';
import { TextInput } from '@/shared/components/text-input.jsx';
import {
  formatDateInputValue,
  formatDisplayDate,
} from '@/shared/config/date-input-format.js';
import { useAppToast } from '@/shared/hooks/use-app-toast.js';

import { labelForShipmentContainerType } from '../config/shipment-container-types.js';
import { useRecordShipmentVgmEmptyReturnMutation } from '../hooks/use-shipment-vgms-query.js';

/**
 * "Trả cont rỗng" (CIF): one row per container (VGM record) with its
 * empty-return date and depot. Only changed rows are saved; an empty
 * date clears the return.
 * @param {{
 *   isOpen: boolean,
 *   onOpenChange: (isOpen: boolean) => void,
 *   contractId: string,
 *   shipmentId: string,
 *   containers: import('../types/index.js').ShipmentVgm[],
 *   deadline: string | null,
 * }} props
 */
export function ShipmentEmptyReturnDialog({
  isOpen,
  onOpenChange,
  contractId,
  shipmentId,
  containers,
  deadline,
}) {
  const toast = useAppToast();
  const mutation = useRecordShipmentVgmEmptyReturnMutation(
    contractId,
    shipmentId,
  );
  const [rows, setRows] = useState(() =>
    Object.fromEntries(
      containers.map((container) => [
        container.id,
        {
          returnedOn: container.emptyReturnedOn ?? '',
          depot: container.emptyReturnDepot ?? '',
        },
      ]),
    ),
  );
  const [submitError, setSubmitError] = useState('');

  /**
   * @param {string} id
   * @param {'returnedOn' | 'depot'} field
   * @param {string} value
   */
  function setRow(id, field, value) {
    setRows((current) => ({
      ...current,
      [id]: { ...current[id], [field]: value },
    }));
  }

  /** @param {import('react').FormEvent<HTMLFormElement>} event */
  async function handleSubmit(event) {
    event.preventDefault();
    setSubmitError('');
    const changed = containers.filter(
      (container) =>
        rows[container.id].returnedOn !== (container.emptyReturnedOn ?? '') ||
        rows[container.id].depot !== (container.emptyReturnDepot ?? ''),
    );
    for (const container of changed) {
      const result = await mutation.mutateAsync({
        vgmId: container.id,
        ...rows[container.id],
      });
      if (!result.success) {
        setSubmitError(`${container.containerNumber}: ${result.message}`);
        return;
      }
    }
    toast({ body: 'Đã cập nhật trả cont rỗng.' });
    onOpenChange(false);
  }

  const returnedCount = containers.filter(
    (container) => rows[container.id].returnedOn,
  ).length;

  return (
    <FormDialog
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      title="Trả cont rỗng"
      subtitle={`Đã trả ${returnedCount}/${containers.length} cont${
        deadline ? ` · Hạn ${formatDisplayDate(deadline)}` : ''
      }`}
      submitLabel="Lưu"
      width={720}
      draft={rows}
      isSubmitting={mutation.isPending}
      submitError={submitError}
      onSubmit={handleSubmit}
    >
      {containers.length === 0 ? (
        <Text color="secondary">
          Lô hàng chưa có container — thêm ở tab VGM.
        </Text>
      ) : (
        <VStack gap={3} hAlign="stretch">
          {containers.map((container, index) => (
            <HStack key={container.id} gap={3} vAlign="end" wrap="wrap">
              <StackItem size="fill">
                <VStack gap={0.5} hAlign="start">
                  <Text size="sm" color="secondary">
                    Cont #{index + 1} ·{' '}
                    {labelForShipmentContainerType(container.containerType)}
                  </Text>
                  <Text weight="bold" type="code">
                    {container.containerNumber}
                  </Text>
                </VStack>
              </StackItem>
              <DateInput
                label="Ngày trả rỗng"
                value={
                  /** @type {import('@astryxdesign/core/Calendar').ISODateString} */ (
                    rows[container.id].returnedOn || null
                  )
                }
                onChange={(value) =>
                  setRow(container.id, 'returnedOn', value ?? '')
                }
                format={formatDateInputValue}
                hasClear
              />
              <TextInput
                label="Depot"
                value={rows[container.id].depot}
                onChange={(value) => setRow(container.id, 'depot', value)}
                isOptional
                isDisabled={!rows[container.id].returnedOn}
              />
            </HStack>
          ))}
        </VStack>
      )}
    </FormDialog>
  );
}
