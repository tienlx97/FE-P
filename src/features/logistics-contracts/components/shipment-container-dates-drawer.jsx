'use client';

import { Button } from '@astryxdesign/core/Button';
import { DateInput } from '@astryxdesign/core/DateInput';
import { HStack } from '@astryxdesign/core/HStack';
import { Icon } from '@astryxdesign/core/Icon';
import { Selector } from '@astryxdesign/core/Selector';
import { Text } from '@astryxdesign/core/Text';
import { VStack } from '@astryxdesign/core/VStack';
import { CalendarRange, CopyCheck, Save } from 'lucide-react';
import { useState } from 'react';

import {
  MetaCompactTable,
  MetaFormSection,
  MetaPill,
} from '@/shared/components/custom/meta/index.js';
import { MetaFormDrawer } from '@/shared/components/meta-form-drawer.jsx';
import { TextInput } from '@/shared/components/text-input.jsx';
import { formatDateInputValue } from '@/shared/config/date-input-format.js';
import { useAppToast } from '@/shared/hooks/use-app-toast.js';

import {
  containerDateFields,
  containerDatesRows,
} from '../config/shipment-container-dates.js';
import { labelForShipmentContainerType } from '../config/shipment-container-types.js';
import { useRecordShipmentContainerDatesMutation } from '../hooks/use-shipment-vgms-query.js';

/** @param {string} value */
const isoDate = (value) =>
  /** @type {import('@astryxdesign/core/Calendar').ISODateString | undefined} */ (
    value || undefined
  );

/**
 * "Ngày container" (`MetaFormDrawer`): the event dates that start / stop
 * each container's free time — empty pickup, gate-in, destination
 * gate-out (separate destination DEM / DET only), empty return + depot.
 * "Nhập nhanh" fills one date into every container (most containers of a
 * lot move on the same day); "Từng container" is a table, one row per
 * container, to fix the odd ones.
 * @param {{
 *   contractId: string,
 *   shipment: import('../types/index.js').Shipment,
 *   incoterm: import('../types/index.js').Incoterm,
 *   containers: import('../types/index.js').ShipmentVgm[],
 *   onClose: () => void,
 * }} props
 */
export function ShipmentContainerDatesDrawer({
  contractId,
  shipment,
  incoterm,
  containers,
  onClose,
}) {
  const toast = useAppToast();
  const mutation = useRecordShipmentContainerDatesMutation(
    contractId,
    shipment.id,
  );
  const fields = containerDateFields(
    incoterm,
    shipment.operationalDetails?.destinationFreeTime,
  );
  const hasReturn = fields.some((field) => field.key === 'emptyReturnedOn');
  const [rows, setRows] = useState(() => containerDatesRows(containers));
  const [bulkField, setBulkField] = useState(
    /** @type {string} */ (fields[0]?.key ?? ''),
  );
  const [bulkDate, setBulkDate] = useState('');
  const [submitError, setSubmitError] = useState('');
  const canEdit = rows.length > 0 && fields.length > 0;

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
    onClose();
  }

  const tableRows = rows.map((row, index) => {
    const container = containers.find((item) => item.id === row.vgmId);
    return {
      id: row.vgmId,
      cells: {
        container: (
          <VStack gap={0.5}>
            <Text type="code" weight="bold">
              {row.containerNumber}
            </Text>
            <Text size="sm" color="secondary">
              #{index + 1}
              {container
                ? ` · ${labelForShipmentContainerType(container.containerType)}`
                : ''}
            </Text>
          </VStack>
        ),
        ...Object.fromEntries(
          fields.map((field) => [
            field.key,
            <DateInput
              key={field.key}
              label={`${field.label} — ${row.containerNumber}`}
              isLabelHidden
              value={isoDate(row[field.key])}
              onChange={(value) => setRow(row.vgmId, field.key, value ?? '')}
              format={formatDateInputValue}
              hasClear
              size="sm"
              width="100%"
            />,
          ]),
        ),
        depot: hasReturn ? (
          <TextInput
            label={`Depot trả rỗng — ${row.containerNumber}`}
            isLabelHidden
            placeholder="Tên depot"
            value={row.emptyReturnDepot}
            onChange={(value) => setRow(row.vgmId, 'emptyReturnDepot', value)}
            isDisabled={!row.emptyReturnedOn}
            size="sm"
            width="100%"
          />
        ) : null,
      },
    };
  });

  return (
    <MetaFormDrawer
      onClose={onClose}
      icon={CalendarRange}
      title="Ngày container"
      meta={
        <HStack gap={2} vAlign="center" wrap="wrap">
          <Text size="sm" weight="bold" color="accent" type="code">
            {shipment.shipmentCode}
          </Text>
          {fields.map((field) => {
            const done = rows.filter((row) => row[field.key]).length;
            const isAll = rows.length > 0 && done === rows.length;
            return (
              <MetaPill
                key={field.key}
                label={`${field.shortLabel} ${done}/${rows.length}`}
                tone={isAll ? 'success' : 'neutral'}
                hasDot={isAll}
              />
            );
          })}
        </HStack>
      }
      draft={rows}
      submitLabel="Lưu ngày container"
      submitIcon={Save}
      isSubmitting={mutation.isPending}
      isSubmitDisabled={!canEdit}
      submitError={submitError}
      onSubmit={handleSubmit}
    >
      {!canEdit ? (
        <MetaFormSection isBoxed isTitleUppercase={false} title="Container">
          <Text color="secondary">
            {rows.length === 0
              ? 'Lô hàng chưa có container — thêm ở tab VGM.'
              : 'Incoterm này không cần theo dõi ngày container.'}
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
              />
              <DateInput
                label="Ngày"
                value={isoDate(bulkDate)}
                onChange={(value) => setBulkDate(value ?? '')}
                format={formatDateInputValue}
                hasClear
              />
              <Button
                label="Áp dụng cho tất cả"
                type="button"
                variant="secondary"
                icon={<Icon icon={CopyCheck} size="sm" />}
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
            <MetaCompactTable
              columns={[
                { key: 'container', header: 'Container' },
                ...fields.map((field) => ({
                  key: field.key,
                  header: field.label,
                })),
                ...(hasReturn ? [{ key: 'depot', header: 'Depot trả rỗng' }] : []),
              ]}
              rows={tableRows}
              emptyLabel="Lô hàng chưa có container."
            />
          </MetaFormSection>
        </>
      )}
    </MetaFormDrawer>
  );
}
