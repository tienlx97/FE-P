'use client';

import { AlertDialog } from '@astryxdesign/core/AlertDialog';
import { Button } from '@astryxdesign/core/Button';
import { HStack } from '@astryxdesign/core/HStack';
import { Icon } from '@astryxdesign/core/Icon';
import { IconButton } from '@astryxdesign/core/IconButton';
import {
  pixel,
  proportional,
  Table,
  useTableStickyColumns,
} from '@astryxdesign/core/Table';
import { Text } from '@astryxdesign/core/Text';
import { VStack } from '@astryxdesign/core/VStack';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';

import { formatDisplayDate } from '@/shared/config/date-input-format.js';

import { labelForShipmentContainerType } from '../config/shipment-container-types.js';
import {
  useDeleteShipmentVgmMutation,
  useShipmentVgmsQuery,
} from '../hooks/use-shipment-vgms-query.js';
import { ShipmentVgmFormDialog } from './shipment-vgm-form-dialog.jsx';

/** @param {string | number | null | undefined} value */
function orDash(value) {
  return value == null || value === '' ? '—' : value;
}

/**
 * The VGM table + add/edit/delete affordances for one `Shipment`, factored
 * out of `ShipmentExpandedDetails` so `ShipmentFormDialog`'s own "VGM" tab
 * (per user request, 2026-09-05) can reuse the same table instead of
 * duplicating its columns.
 *
 * Add/edit dialog ownership is conditional, mirroring the split that already
 * existed in `ShipmentExpandedDetails`: pass `onAddVgm`/`onEditVgm` when this
 * renders inside a `<table>` row-expansion panel (`ContractsList`'s
 * "Selector popover stacking" note — a `*FormDialog` declared inside
 * `renderExpanded` breaks `Selector`'s popover positioning, so the caller
 * must render `ShipmentVgmFormDialog` itself, outside the table). Omit them
 * when this renders somewhere without that constraint (e.g.
 * `ShipmentFormDialog`'s own tab, which is not inside any table) and this
 * component owns the add/edit dialog locally. The delete confirmation has no
 * `Selector` field, so it's always owned locally either way.
 * @param {{
 *   contractId: string,
 *   shipmentId: string,
 *   customersById: Map<string, import('../types/index.js').Customer>,
 *   isReadOnly?: boolean,
 *   onAddVgm?: () => void,
 *   onEditVgm?: (vgm: import('../types/index.js').ShipmentVgm) => void,
 * }} props
 */
export function ShipmentVgmSection({
  contractId,
  shipmentId,
  customersById,
  isReadOnly = false,
  onAddVgm,
  onEditVgm,
}) {
  const [localVgmDialog, setLocalVgmDialog] = useState(
    /** @type {{ vgm: import('../types/index.js').ShipmentVgm | null } | null} */ (
      null
    ),
  );
  const [deletingVgm, setDeletingVgm] = useState(
    /** @type {import('../types/index.js').ShipmentVgm | null} */ (null),
  );

  const vgmsQuery = useShipmentVgmsQuery(contractId, shipmentId);
  const vgms = vgmsQuery.data?.success ? vgmsQuery.data.vgms : [];

  const deleteMutation = useDeleteShipmentVgmMutation(contractId, shipmentId);

  async function handleConfirmDelete() {
    if (!deletingVgm) return;
    await deleteMutation.mutateAsync(deletingVgm.id);
    setDeletingVgm(null);
  }

  const handleAdd = onAddVgm ?? (() => setLocalVgmDialog({ vgm: null }));
  const handleEdit = onEditVgm ?? ((vgm) => setLocalVgmDialog({ vgm }));

  /** @type {import('@astryxdesign/core/Table').TableColumn<import('../types/index.js').ShipmentVgm & Record<string, unknown>>[]} */
  const vgmColumns = [
    {
      key: 'carrierCustomerId',
      header: 'Nhà vận chuyển',
      width: proportional(1, { minWidth: 160 }),
      renderCell: (vgm) =>
        orDash(customersById.get(vgm.carrierCustomerId)?.companyName),
    },
    {
      key: 'packingDate',
      header: 'Ngày đóng hàng',
      width: pixel(150),
      renderCell: (vgm) => formatDisplayDate(vgm.packingDate),
    },
    {
      key: 'containerType',
      header: 'Loại cont',
      width: pixel(90),
      renderCell: (vgm) => labelForShipmentContainerType(vgm.containerType),
    },
    {
      key: 'containerNumber',
      header: 'Tên cont',
      width: proportional(1),
      renderCell: (vgm) => vgm.containerNumber,
    },
    {
      key: 'sealNumber',
      header: 'Tên seal',
      width: proportional(1),
      renderCell: (vgm) => vgm.sealNumber,
    },
    {
      key: 'maxGross',
      header: 'Max gross (kg)',
      width: proportional(1, { minWidth: 150 }),
      renderCell: (vgm) => vgm.maxGross.toFixed(2),
    },
    {
      key: 'tare',
      header: 'Tare (kg)',
      width: pixel(110),
      renderCell: (vgm) => vgm.tare.toFixed(2),
    },
    {
      key: 'grossWeight',
      header: 'G.W (kg)',
      width: proportional(1, { minWidth: 170 }),
      renderCell: (vgm) => vgm.grossWeight.toFixed(2),
    },
    {
      key: 'vgm',
      header: 'VGM (kg)',
      width: proportional(1),
      renderCell: (vgm) => vgm.vgm.toFixed(2),
    },
  ];

  vgmColumns.push({
    key: 'actions',
    header: '',
    width: pixel(90),
    renderCell: (vgm) => (
      <HStack gap={1} vAlign="center" hAlign="end">
        <IconButton
          isDisabled={isReadOnly}
          label={`Sửa ${vgm.containerNumber}`}
          tooltip="Sửa VGM"
          icon={<Icon icon={Pencil} size="sm" />}
          variant="ghost"
          size="sm"
          onClick={() => handleEdit(vgm)}
        />
        <IconButton
          isDisabled={isReadOnly}
          label={`Xoá ${vgm.containerNumber}`}
          tooltip="Xoá VGM"
          icon={<Icon icon={Trash2} size="sm" />}
          variant="ghost"
          size="sm"
          onClick={() => setDeletingVgm(vgm)}
        />
      </HStack>
    ),
  });

  const vgmStickyColumns =
    /** @type {import('@astryxdesign/core/Table').TablePlugin<import('../types/index.js').ShipmentVgm & Record<string, unknown>>} */ (
      useTableStickyColumns({ endKeys: ['actions'] })
    );

  return (
    <VStack gap={3} hAlign="stretch">
      <HStack hAlign="between" vAlign="center">
        <Text weight="semibold">VGM</Text>
        <Button
          isDisabled={isReadOnly}
          label="Thêm VGM"
          variant="secondary"
          size="sm"
          icon={<Icon icon={Plus} />}
          onClick={handleAdd}
        />
      </HStack>

      {vgms.length === 0 ? (
        <Text color="secondary">Chưa có bản ghi VGM</Text>
      ) : (
        <Table
          columns={vgmColumns}
          data={vgms}
          idKey="id"
          dividers="rows"
          density="compact"
          plugins={{ stickyColumns: vgmStickyColumns }}
        />
      )}

      <AlertDialog
        isOpen={deletingVgm !== null}
        onOpenChange={(nextIsOpen) => {
          if (!nextIsOpen) setDeletingVgm(null);
        }}
        title={`Xoá VGM ${deletingVgm?.containerNumber ?? ''}?`}
        description="Hành động này không thể hoàn tác."
        actionLabel="Xoá"
        onAction={handleConfirmDelete}
      />

      {onAddVgm || onEditVgm ? null : (
        <ShipmentVgmFormDialog
          key={localVgmDialog?.vgm?.id ?? 'create'}
          isOpen={localVgmDialog !== null}
          onOpenChange={(nextIsOpen) => {
            if (!nextIsOpen) setLocalVgmDialog(null);
          }}
          contractId={contractId}
          shipmentId={shipmentId}
          vgm={localVgmDialog?.vgm ?? null}
        />
      )}
    </VStack>
  );
}
