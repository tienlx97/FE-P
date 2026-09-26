'use client';

import { Button } from '@astryxdesign/core/Button';
import { DateInput } from '@astryxdesign/core/DateInput';
import { HStack } from '@astryxdesign/core/HStack';
import { Icon } from '@astryxdesign/core/Icon';
import { IconButton } from '@astryxdesign/core/IconButton';
import { Text } from '@astryxdesign/core/Text';
import { VStack } from '@astryxdesign/core/VStack';
import { Plus, Save, Split, Trash2 } from 'lucide-react';
import { useState } from 'react';

import {
  MetaCompactTable,
  MetaFormSection,
} from '@/shared/components/custom/meta/index.js';
import { MetaFormDrawer } from '@/shared/components/meta-form-drawer.jsx';
import { TextInput } from '@/shared/components/text-input.jsx';
import { formatDateInputValue } from '@/shared/config/date-input-format.js';
import { useAppToast } from '@/shared/hooks/use-app-toast.js';

import {
  blankTransshipmentRow,
  transshipmentErrors,
  transshipmentRows,
} from '../config/shipment-documents.js';
import { useShipmentDocumentsMutations } from '../hooks/use-shipment-schedule-query.js';

const MAX_LEGS = 10;

/** Estimate above actual, per side of the port call. */
/** @type {Array<{ key: string, header: string, fields: Array<['eta' | 'ata' | 'etd' | 'atd', string]> }>} */
const DATE_COLUMNS = [
  { key: 'arrival', header: 'Đến (ETA / ATA)', fields: [['eta', 'ETA'], ['ata', 'ATA']] },
  { key: 'departure', header: 'Rời (ETD / ATD)', fields: [['etd', 'ETD'], ['atd', 'ATD']] },
];

/** @param {string} value */
const isoDate = (value) =>
  /** @type {import('@astryxdesign/core/Calendar').ISODateString | undefined} */ (
    value || undefined
  );

/**
 * "Chuyển tải" (`MetaFormDrawer`): the transshipment ports in route order,
 * one table row each (port, connecting vessel / voyage, ETA / ATA / ETD /
 * ATD at that port). Saving replaces every leg; no leg = direct.
 * @param {{
 *   contractId: string,
 *   shipment: import('../types/index.js').Shipment,
 *   legs: import('../types/index.js').TransshipmentLeg[] | undefined,
 *   onClose: () => void,
 * }} props
 */
export function ShipmentTransshipmentDrawer({
  contractId,
  shipment,
  legs,
  onClose,
}) {
  const toast = useAppToast();
  const { transshipment: mutation } = useShipmentDocumentsMutations(
    contractId,
    shipment.id,
  );
  const [rows, setRows] = useState(() => {
    const saved = transshipmentRows(legs);
    return saved.length > 0 ? saved : [blankTransshipmentRow()];
  });
  const [errors, setErrors] = useState(
    /** @type {ReturnType<typeof transshipmentErrors>} */ ({}),
  );
  const [submitError, setSubmitError] = useState('');

  /**
   * @param {string} rowKey
   * @param {Exclude<keyof import('../types/index.js').TransshipmentLegFormRow, 'rowKey'>} field
   * @param {string} value
   */
  function setRow(rowKey, field, value) {
    setRows((current) =>
      current.map((row) => (row.rowKey === rowKey ? { ...row, [field]: value } : row)),
    );
  }

  /** @param {import('react').FormEvent<HTMLFormElement>} event */
  async function handleSubmit(event) {
    event.preventDefault();
    setSubmitError('');
    // Rows left completely blank are dropped, not errors.
    const filled = rows.filter((row) =>
      Object.entries(row).some(([key, value]) => key !== 'rowKey' && value.trim()),
    );
    const nextErrors = transshipmentErrors(filled);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    const result = await mutation.mutateAsync(filled);
    if (!result.success) {
      setSubmitError(result.message);
      return;
    }
    toast({
      body: filled.length > 0 ? 'Đã lưu chuyển tải.' : 'Đã chuyển lô hàng về đi thẳng.',
    });
    onClose();
  }

  /**
   * @param {string} rowKey
   * @param {'port' | 'vesselName' | 'voyageNumber'} field
   */
  const statusOf = (rowKey, field) =>
    errors[rowKey]?.[field]
      ? {
          status: /** @type {const} */ ({ type: 'error', message: errors[rowKey][field] }),
          statusVariant: /** @type {const} */ ('tooltip'),
        }
      : {};

  const tableRows = rows.map((row, index) => ({
    id: row.rowKey,
    cells: {
      no: (
        <Text color="secondary" hasTabularNumbers>
          {index + 1}
        </Text>
      ),
      port: (
        <TextInput
          label={`Cảng chuyển tải ${index + 1}`}
          isLabelHidden
          placeholder="Ví dụ: Singapore"
          value={row.port}
          onChange={(value) => setRow(row.rowKey, 'port', value)}
          size="sm"
          width="100%"
          {...statusOf(row.rowKey, 'port')}
        />
      ),
      vessel: (
        <VStack gap={1} hAlign="stretch">
          <TextInput
            label={`Tàu nối chuyến ${index + 1}`}
            isLabelHidden
            placeholder="Tàu"
            value={row.vesselName}
            onChange={(value) => setRow(row.rowKey, 'vesselName', value)}
            size="sm"
            width="100%"
            {...statusOf(row.rowKey, 'vesselName')}
          />
          <TextInput
            label={`Chuyến ${index + 1}`}
            isLabelHidden
            placeholder="Chuyến"
            value={row.voyageNumber}
            onChange={(value) => setRow(row.rowKey, 'voyageNumber', value)}
            size="sm"
            width="100%"
            {...statusOf(row.rowKey, 'voyageNumber')}
          />
        </VStack>
      ),
      ...Object.fromEntries(
        DATE_COLUMNS.map((column) => [
          column.key,
          <VStack key={column.key} gap={1} hAlign="stretch">
            {column.fields.map(([field, label]) => (
              <HStack key={field} gap={1.5} vAlign="center" wrap="nowrap">
                <Text size="sm" color="secondary" type="code">
                  {label}
                </Text>
                <DateInput
                  label={`${label} chặng ${index + 1}`}
                  isLabelHidden
                  value={isoDate(row[field])}
                  onChange={(value) => setRow(row.rowKey, field, value ?? '')}
                  format={formatDateInputValue}
                  hasClear
                  size="sm"
                  width="100%"
                />
              </HStack>
            ))}
          </VStack>,
        ]),
      ),
      remove: (
        <IconButton
          label={`Xoá chặng ${index + 1}`}
          tooltip="Xoá chặng"
          icon={<Icon icon={Trash2} size="sm" />}
          variant="ghost"
          size="sm"
          type="button"
          onClick={() =>
            setRows((current) => current.filter((item) => item.rowKey !== row.rowKey))
          }
        />
      ),
    },
  }));

  return (
    <MetaFormDrawer
      onClose={onClose}
      icon={Split}
      title="Chuyển tải"
      meta={
        <Text size="sm" weight="bold" color="accent" type="code">
          {shipment.shipmentCode}
        </Text>
      }
      width={960}
      draft={rows.map(({ rowKey: _rowKey, ...row }) => row)}
      submitLabel="Lưu chuyển tải"
      submitIcon={Save}
      isSubmitting={mutation.isPending}
      submitError={submitError}
      onSubmit={handleSubmit}
    >
      <MetaFormSection
        isBoxed
        isTitleUppercase={false}
        title="Các cảng chuyển tải"
        meta="Theo thứ tự tuyến · không có chặng = đi thẳng"
        action={
          <Button
            label="Thêm chặng"
            type="button"
            variant="secondary"
            size="sm"
            icon={<Icon icon={Plus} size="sm" />}
            isDisabled={rows.length >= MAX_LEGS}
            onClick={() => setRows((current) => [...current, blankTransshipmentRow()])}
          />
        }
      >
        <MetaCompactTable
          columns={[
            { key: 'no', header: '#', align: 'center' },
            { key: 'port', header: 'Cảng', isWrapping: true },
            { key: 'vessel', header: 'Tàu / chuyến nối', isWrapping: true },
            ...DATE_COLUMNS.map(({ key, header }) => ({ key, header })),
            { key: 'remove', header: '', align: 'center' },
          ]}
          rows={tableRows}
          emptyLabel="Đi thẳng — không có chặng chuyển tải."
        />
      </MetaFormSection>
    </MetaFormDrawer>
  );
}
