'use client';

import { DateInput } from '@astryxdesign/core/DateInput';
import { HStack } from '@astryxdesign/core/HStack';
import { StackItem } from '@astryxdesign/core/Stack';
import { Text } from '@astryxdesign/core/Text';
import { VStack } from '@astryxdesign/core/VStack';
import * as stylex from '@stylexjs/stylex';
import { RotateCcw, Save } from 'lucide-react';
import { useState } from 'react';

import {
  MetaFormSection,
  MetaPill,
} from '@/shared/components/custom/meta/index.js';
import { MetaFormDialog } from '@/shared/components/meta-form-dialog.jsx';
import { TextInput } from '@/shared/components/text-input.jsx';
import {
  formatDateInputValue,
  formatDisplayDate,
} from '@/shared/config/date-input-format.js';
import { useAppToast } from '@/shared/hooks/use-app-toast.js';

import { labelForShipmentContainerType } from '../config/shipment-container-types.js';
import { useRecordShipmentVgmEmptyReturnMutation } from '../hooks/use-shipment-vgms-query.js';

/** Local calendar date as ISO "YYYY-MM-DD". */
function todayIso() {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${now.getFullYear()}-${month}-${day}`;
}

/**
 * "Trả cont rỗng" (CIF): one row per container (VGM record) with its
 * empty-return date and depot. Only changed rows are saved; an empty
 * date clears the return. Meta dialog frame (`MetaFormDialog`): returned
 * count and deadline pills in the header (amber / red while incomplete /
 * overdue), then a boxed card with one row per container.
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
  const isComplete =
    containers.length > 0 && returnedCount === containers.length;
  const isOverdue = !isComplete && (deadline ?? '9999-12-31') < todayIso();

  return (
    <MetaFormDialog
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      icon={RotateCcw}
      title="Ghi nhận trả cont rỗng"
      meta={
        <HStack gap={2} vAlign="center" wrap="wrap">
          <MetaPill
            label={`Đã trả ${returnedCount}/${containers.length} cont`}
            tone={isComplete ? 'success' : 'warning'}
            hasDot
          />
          {deadline ? (
            <MetaPill
              label={`Hạn trả ${formatDisplayDate(deadline)}`}
              tone={isOverdue ? 'danger' : 'neutral'}
              hasBorder={isOverdue}
            />
          ) : null}
        </HStack>
      }
      width={760}
      draft={rows}
      submitLabel="Lưu thay đổi"
      submitIcon={Save}
      isSubmitting={mutation.isPending}
      submitError={submitError}
      onSubmit={handleSubmit}
    >
      <MetaFormSection
        isBoxed
        isTitleUppercase={false}
        title="Container"
        meta="Để trống ngày trả để bỏ ghi nhận"
      >
        {containers.length === 0 ? (
          <Text color="secondary">
            Lô hàng chưa có container — thêm ở tab VGM.
          </Text>
        ) : (
          <VStack gap={0} hAlign="stretch">
            {containers.map((container, index) => {
              const row = rows[container.id];
              return (
                <HStack
                  key={container.id}
                  gap={3}
                  vAlign="end"
                  wrap="wrap"
                  xstyle={[styles.row, index === 0 && styles.firstRow]}
                >
                  <StackItem size="fill">
                    <VStack gap={1} hAlign="start" xstyle={styles.identity}>
                      <Text size="sm" color="secondary">
                        Cont #{index + 1} ·{' '}
                        {labelForShipmentContainerType(container.containerType)}
                      </Text>
                      <HStack gap={2} vAlign="center" wrap="wrap">
                        <Text weight="bold" type="code">
                          {container.containerNumber}
                        </Text>
                        <MetaPill
                          label={row.returnedOn ? 'Đã trả' : 'Chưa trả'}
                          tone={row.returnedOn ? 'success' : 'neutral'}
                          size="sm"
                          hasDot={Boolean(row.returnedOn)}
                        />
                      </HStack>
                    </VStack>
                  </StackItem>
                  <DateInput
                    label="Ngày trả rỗng"
                    value={
                      /** @type {import('@astryxdesign/core/Calendar').ISODateString | undefined} */ (
                        row.returnedOn || undefined
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
                    placeholder="Tên depot"
                    value={row.depot}
                    onChange={(value) => setRow(container.id, 'depot', value)}
                    isOptional
                    isDisabled={!row.returnedOn}
                  />
                </HStack>
              );
            })}
          </VStack>
        )}
      </MetaFormSection>
    </MetaFormDialog>
  );
}

const styles = stylex.create({
  row: {
    borderTopColor: 'var(--meta-hairline)',
    borderTopStyle: 'solid',
    borderTopWidth: 'var(--border-width)',
    paddingBlock: 'var(--spacing-3)',
  },
  firstRow: {
    borderTopWidth: 0,
    paddingTop: 0,
  },
  identity: {
    minWidth: 0,
  },
});
