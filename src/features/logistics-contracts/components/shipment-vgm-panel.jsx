'use client';

import { AlertDialog } from '@astryxdesign/core/AlertDialog';
import { useState } from 'react';

import {
  MetaThemeProvider,
  MetaVgmPanel,
} from '@/shared/components/custom/meta/index.js';
import { formatDisplayDate } from '@/shared/config/date-input-format.js';

import { labelForShipmentContainerType } from '../config/shipment-container-types.js';
import { summarizeShipmentVgms } from '../config/shipment-vgm-summary.js';
import { useDeleteShipmentVgmMutation } from '../hooks/use-shipment-vgms-query.js';
import { ShipmentVgmFormDialog } from './shipment-vgm-form-dialog.jsx';

const WEIGHT_FORMATTER = new Intl.NumberFormat('en-US', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});
const TONNE_FORMATTER = new Intl.NumberFormat('en-US', {
  maximumFractionDigits: 2,
});

/**
 * Shipment detail "VGM" tab (Figma 120:9075): feeds `MetaVgmPanel` from
 * the shipment's VGM records and owns the add / edit / delete dialogs and
 * the Excel export. `vgms` comes from the workspace's own query (already
 * sorted by sequence number) so the tab count and this table agree.
 *
 * @param {{
 *   contractId: string,
 *   shipment: import('../types/index.js').Shipment,
 *   vgms: import('../types/index.js').ShipmentVgm[],
 *   isLoading: boolean,
 *   customersById: Map<string, import('../types/index.js').Customer>,
 * }} props
 */
export function ShipmentVgmPanel({
  contractId,
  shipment,
  vgms,
  isLoading,
  customersById,
}) {
  const [formDialog, setFormDialog] = useState(
    /** @type {{ vgm: import('../types/index.js').ShipmentVgm | null } | null} */ (
      null
    ),
  );
  const [deletingVgm, setDeletingVgm] = useState(
    /** @type {import('../types/index.js').ShipmentVgm | null} */ (null),
  );
  const deleteMutation = useDeleteShipmentVgmMutation(contractId, shipment.id);

  const summary = summarizeShipmentVgms(vgms, shipment);
  /** "2×40'HC, 2×20'" */
  /** @param {string} separator */
  const typeMix = (separator) =>
    summary.typeCounts
      .map(
        ({ type, count }) => `${count}×${labelForShipmentContainerType(type)}`,
      )
      .join(separator);

  /** @param {string} id */
  const vgmById = (id) => vgms.find((vgm) => vgm.id === id) ?? null;
  /** @param {string} customerId */
  const carrierName = (customerId) =>
    customersById.get(customerId)?.companyName ?? '—';

  async function handleConfirmDelete() {
    if (!deletingVgm) return;
    await deleteMutation.mutateAsync(deletingVgm.id);
    setDeletingVgm(null);
  }

  async function handleExport() {
    const XLSX = await import('xlsx');
    const sheet = XLSX.utils.json_to_sheet(
      vgms.map((vgm) => ({
        STT: vgm.sequenceNumber,
        'Nhà vận chuyển': carrierName(vgm.carrierCustomerId),
        'Ngày đóng': formatDisplayDate(vgm.packingDate),
        'Loại cont': labelForShipmentContainerType(vgm.containerType),
        'Số container': vgm.containerNumber,
        'Số seal': vgm.sealNumber,
        'Max gross (kg)': vgm.maxGross,
        'Tare (kg)': vgm.tare,
        'G.W (kg)': vgm.grossWeight,
        'VGM (kg)': vgm.vgm,
      })),
    );
    const book = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(book, sheet, 'VGM');
    XLSX.writeFile(
      book,
      `vgm-${shipment.shipmentCode.replace(/[/\\]/g, '-')}.xlsx`,
    );
  }

  return (
    <>
      <MetaVgmPanel
        count={vgms.length}
        isLoading={isLoading}
        containers={{
          value: `${summary.containerCount} Cont`,
          note: vgms.length > 0 ? `(${typeMix(', ')})` : undefined,
        }}
        weight={{
          value: `${WEIGHT_FORMATTER.format(summary.vgm)} kg`,
          note: `(~${TONNE_FORMATTER.format(summary.vgm / 1000)} Tấn)`,
        }}
        declared={
          summary.declaredRatio === null
            ? { value: '—', note: '(chưa có số cont kế hoạch)' }
            : {
                value: `${Math.round(summary.declaredRatio * 100)}%`,
                note: `(${summary.declaredCount}/${summary.plannedContainerCount} cont đã khai VGM)`,
              }
        }
        rows={vgms.map((vgm) => ({
          id: vgm.id,
          no: String(vgm.sequenceNumber),
          carrier: carrierName(vgm.carrierCustomerId),
          packingDate: formatDisplayDate(vgm.packingDate),
          typeLabel: labelForShipmentContainerType(vgm.containerType),
          containerNumber: vgm.containerNumber,
          sealNumber: vgm.sealNumber,
          maxGross: WEIGHT_FORMATTER.format(vgm.maxGross),
          tare: WEIGHT_FORMATTER.format(vgm.tare),
          grossWeight: WEIGHT_FORMATTER.format(vgm.grossWeight),
          vgm: WEIGHT_FORMATTER.format(vgm.vgm),
        }))}
        totals={
          vgms.length > 0
            ? {
                label: 'Σ Tổng cộng',
                containers: `${summary.containerCount} Cont`,
                types: typeMix(' / '),
                containerNumbers: `${summary.containerCount} số cont`,
                seals: `${summary.sealCount} chì niêm`,
                maxGross: `${WEIGHT_FORMATTER.format(summary.maxGross)} kg`,
                tare: `${WEIGHT_FORMATTER.format(summary.tare)} kg`,
                grossWeight: `${WEIGHT_FORMATTER.format(summary.grossWeight)} kg`,
                vgm: `${WEIGHT_FORMATTER.format(summary.vgm)} kg`,
              }
            : null
        }
        onExport={handleExport}
        onCreate={() => setFormDialog({ vgm: null })}
        onEdit={(id) => setFormDialog({ vgm: vgmById(id) })}
        onDelete={(id) => setDeletingVgm(vgmById(id))}
      />

      {/* Dialogs portal out of the page tree, so they re-apply Meta. */}
      <MetaThemeProvider>
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
        {formDialog ? (
          <ShipmentVgmFormDialog
            key={formDialog.vgm?.id ?? 'create'}
            isOpen
            onOpenChange={(nextIsOpen) => {
              if (!nextIsOpen) setFormDialog(null);
            }}
            contractId={contractId}
            shipmentId={shipment.id}
            vgm={formDialog.vgm}
          />
        ) : null}
      </MetaThemeProvider>
    </>
  );
}
