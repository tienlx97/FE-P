'use client';

import { Button } from '@astryxdesign/core/Button';
import { DateInput } from '@astryxdesign/core/DateInput';
import { HStack } from '@astryxdesign/core/HStack';
import { Icon } from '@astryxdesign/core/Icon';
import { Selector } from '@astryxdesign/core/Selector';
import { StackItem } from '@astryxdesign/core/Stack';
import { Text } from '@astryxdesign/core/Text';
import { VStack } from '@astryxdesign/core/VStack';
import * as stylex from '@stylexjs/stylex';
import { CalendarRange, CopyCheck, Save } from 'lucide-react';
import { useState } from 'react';

import {
  MetaFormSection,
  MetaPill,
} from '@/shared/components/custom/meta/index.js';
import { MetaFormDialog } from '@/shared/components/meta-form-dialog.jsx';
import { TextInput } from '@/shared/components/text-input.jsx';
import { formatDateInputValue } from '@/shared/config/date-input-format.js';
import { useAppToast } from '@/shared/hooks/use-app-toast.js';

import {
  containerDateFields,
  containerDatesRows,
} from '../config/shipment-container-dates.js';
import { labelForShipmentContainerType } from '../config/shipment-container-types.js';
import { useRecordShipmentContainerDatesMutation } from '../hooks/use-shipment-vgms-query.js';

/**
 * "Ngày container": the event dates that start / stop each container's
 * free time — empty pickup, gate-in, destination gate-out (separate
 * destination DEM / DET only), empty return + depot — for every container
 * at once. "Áp dụng cho tất cả" fills one date into every container (most
 * containers of a lot move on the same day); then fix the odd ones.
 * @param {{
 *   isOpen: boolean,
 *   onOpenChange: (isOpen: boolean) => void,
 *   contractId: string,
 *   shipmentId: string,
 *   incoterm: import('../types/index.js').Incoterm,
 *   destinationFreeTime: import('../types/index.js').ContainerFreeTime | null | undefined,
 *   containers: import('../types/index.js').ShipmentVgm[],
 * }} props
 */
export function ShipmentContainerDatesDialog({
  isOpen,
  onOpenChange,
  contractId,
  shipmentId,
  incoterm,
  destinationFreeTime,
  containers,
}) {
  const toast = useAppToast();
  const mutation = useRecordShipmentContainerDatesMutation(
    contractId,
    shipmentId,
  );
  const fields = containerDateFields(incoterm, destinationFreeTime);
  const [rows, setRows] = useState(() => containerDatesRows(containers));
  const [bulkField, setBulkField] = useState(
    /** @type {string} */ (fields[0]?.key ?? ''),
  );
  const [bulkDate, setBulkDate] = useState('');
  const [submitError, setSubmitError] = useState('');

  /**
   * @param {string} vgmId
   * @param {keyof import('../types/index.js').ContainerDatesFormRow} field
   * @param {string} value
   */
  function setRow(vgmId, field, value) {
    setRows((current) =>
      current.map((row) =>
        row.vgmId === vgmId ? { ...row, [field]: value } : row,
      ),
    );
  }

  function applyToAll() {
    const field =
      /** @type {keyof import('../types/index.js').ContainerDatesFormRow} */ (
        bulkField
      );
    setRows((current) => current.map((row) => ({ ...row, [field]: bulkDate })));
  }

  /** @param {import('react').FormEvent<HTMLFormElement>} event */
  async function handleSubmit(event) {
    event.preventDefault();
    setSubmitError('');
    const result = await mutation.mutateAsync(rows);
    if (!result.success) {
      setSubmitError(result.message);
      return;
    }
    toast({ body: 'Đã lưu ngày container.' });
    onOpenChange(false);
  }

  return (
    <MetaFormDialog
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      icon={CalendarRange}
      title="Ngày container"
      meta={
        <HStack gap={2} vAlign="center" wrap="wrap">
          {fields.map((field) => {
            const done = rows.filter((row) => row[field.key]).length;
            return (
              <MetaPill
                key={field.key}
                label={`${field.shortLabel} ${done}/${rows.length}`}
                tone={rows.length > 0 && done === rows.length ? 'success' : 'neutral'}
                hasDot={rows.length > 0 && done === rows.length}
              />
            );
          })}
        </HStack>
      }
      width={960}
      draft={rows}
      submitLabel="Lưu ngày container"
      submitIcon={Save}
      isSubmitting={mutation.isPending}
      submitError={submitError}
      onSubmit={handleSubmit}
    >
      {rows.length === 0 ? (
        <MetaFormSection isBoxed isTitleUppercase={false} title="Container">
          <Text color="secondary">
            Lô hàng chưa có container — thêm ở tab VGM.
          </Text>
        </MetaFormSection>
      ) : (
        <>
          <MetaFormSection
            isBoxed
            isTitleUppercase={false}
            index={1}
            title="Nhập nhanh"
            meta="Điền một ngày cho mọi container"
          >
            <HStack gap={3} vAlign="end" wrap="wrap">
              <Selector
                label="Loại ngày"
                value={bulkField}
                onChange={setBulkField}
                options={fields.map((field) => ({
                  value: field.key,
                  label: field.label,
                }))}
                width="100%"
              />
              <DateInput
                label="Ngày"
                value={
                  /** @type {import('@astryxdesign/core/Calendar').ISODateString | undefined} */ (
                    bulkDate || undefined
                  )
                }
                onChange={(value) => setBulkDate(value ?? '')}
                format={formatDateInputValue}
                hasClear
              />
              <Button
                label="Áp dụng cho tất cả"
                type="button"
                variant="secondary"
                icon={<Icon icon={CopyCheck} size="sm" />}
                isDisabled={!bulkField}
                onClick={applyToAll}
              />
            </HStack>
          </MetaFormSection>

          <MetaFormSection
            isBoxed
            isTitleUppercase={false}
            index={2}
            title="Từng container"
            meta="Để trống = chưa xảy ra"
          >
            <VStack gap={0} hAlign="stretch">
              {rows.map((row, index) => {
                const container = containers.find(
                  (item) => item.id === row.vgmId,
                );
                return (
                  <HStack
                    key={row.vgmId}
                    gap={3}
                    vAlign="end"
                    wrap="wrap"
                    xstyle={[styles.row, index === 0 && styles.firstRow]}
                  >
                    <StackItem size="fill">
                      <VStack gap={1} hAlign="start" xstyle={styles.identity}>
                        <Text size="sm" color="secondary">
                          Cont #{index + 1}
                          {container
                            ? ` · ${labelForShipmentContainerType(container.containerType)}`
                            : ''}
                        </Text>
                        <Text weight="bold" type="code">
                          {row.containerNumber}
                        </Text>
                      </VStack>
                    </StackItem>
                    {fields.map((field) => (
                      <DateInput
                        key={field.key}
                        label={field.label}
                        value={
                          /** @type {import('@astryxdesign/core/Calendar').ISODateString | undefined} */ (
                            row[field.key] || undefined
                          )
                        }
                        onChange={(value) =>
                          setRow(row.vgmId, field.key, value ?? '')
                        }
                        format={formatDateInputValue}
                        hasClear
                      />
                    ))}
                    {fields.some((field) => field.key === 'emptyReturnedOn') ? (
                      <TextInput
                        label="Depot trả rỗng"
                        placeholder="Tên depot"
                        value={row.emptyReturnDepot}
                        onChange={(value) =>
                          setRow(row.vgmId, 'emptyReturnDepot', value)
                        }
                        isOptional
                        isDisabled={!row.emptyReturnedOn}
                      />
                    ) : null}
                  </HStack>
                );
              })}
            </VStack>
          </MetaFormSection>
        </>
      )}
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
