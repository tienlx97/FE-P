'use client';

import { AlertDialog } from '@astryxdesign/core/AlertDialog';
import { useState } from 'react';

import {
  MetaThemeProvider,
  MetaVgmPanel,
} from '@/shared/components/custom/meta/index.js';
import { formatDisplayDate } from '@/shared/config/date-input-format.js';
import { downloadBlob } from '@/shared/config/download-blob.js';
import { useAppToast } from '@/shared/hooks/use-app-toast.js';

import { buildContainerExportWorkbook } from '../config/container-workbook.js';
import { labelForShipmentContainerType } from '../config/shipment-container-types.js';
import { summarizeShipmentVgms } from '../config/shipment-vgm-summary.js';
import { useEmptyDepots } from '../hooks/use-empty-depots.js';
import { useDeleteShipmentVgmMutation } from '../hooks/use-shipment-vgms-query.js';
import { ShipmentVgmBulkDrawer } from './shipment-vgm-bulk-drawer.jsx';
import { ShipmentVgmDrawer } from './shipment-vgm-drawer.jsx';

const WEIGHT_FORMATTER = new Intl.NumberFormat('en-US', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});
const TONNE_FORMATTER = new Intl.NumberFormat('en-US', {
  maximumFractionDigits: 2,
});

/**
 * Shipment detail "Container & VGM" tab (Figma 120:9075): feeds `MetaVgmPanel` from
 * the shipment's VGM records and owns the add / edit drawers (one
 * container, or a list typed in / imported from Excel), the delete dialog
 * and the Excel export (every container field, re-importable). `vgms` comes from the workspace's own query (already
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
  const [bulkMode, setBulkMode] = useState(
    /** @type {'table' | 'excel' | null} */ (null),
  );
  const deleteMutation = useDeleteShipmentVgmMutation(contractId, shipment.id);
  const { depots } = useEmptyDepots();
  const toast = useAppToast();

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
  /** @param {string | null} customerId */
  const carrierName = (customerId) =>
    (customerId && customersById.get(customerId)?.companyName) || '—';
  /** @param {string | null | undefined} depotId */
  const depotName = (depotId) =>
    (depotId && depots.find((depot) => depot.id === depotId)?.name) || '';
  /** @param {number | null} value */
  const weight = (value) =>
    value === null ? '—' : WEIGHT_FORMATTER.format(value);

  /** Excel export and table picture share one name: "vgm-26KCT27-LOT-01". */
  const fileName = `vgm-${shipment.shipmentCode.replace(/[/\\]/g, '-')}`;

  async function handleConfirmDelete() {
    if (!deletingVgm) return;
    await deleteMutation.mutateAsync(deletingVgm.id);
    setDeletingVgm(null);
  }

  async function handleExport() {
    try {
      const excelModule = await import('exceljs');
      const ExcelJS = /** @type {typeof import('exceljs')} */ (
        'default' in excelModule ? excelModule.default : excelModule
      );
      const workbook = buildContainerExportWorkbook(ExcelJS, {
        shipmentCode: shipment.shipmentCode,
        typeMix: typeMix(', '),
        exportedAt: new Date(),
        rows: vgms.map((vgm) => ({
          sequenceNumber: vgm.sequenceNumber,
          containerNumber: vgm.containerNumber,
          typeLabel: labelForShipmentContainerType(vgm.containerType),
          sealNumber: vgm.sealNumber ?? '',
          carrier: vgm.carrierCustomerId
            ? (customersById.get(vgm.carrierCustomerId)?.companyName ?? '')
            : '',
          depot: depotName(vgm.emptyPickupDepotId),
          packingDate: vgm.packingDate,
          plannedPackingTime: vgm.plannedPackingTime?.slice(0, 5) ?? '',
          actualPackingTime: vgm.actualPackingTime?.slice(0, 5) ?? '',
          truckArrivalTime: vgm.truckArrivalTime?.slice(0, 5) ?? '',
          maxGross: vgm.maxGross,
          tare: vgm.tare,
          payload: vgm.payload,
          netWeight: vgm.netWeight,
          packagingWeight: vgm.packagingWeight,
          note: vgm.note ?? '',
          grossWeight: vgm.grossWeight,
          vgm: vgm.vgm,
          isVgmDeclared: vgm.isVgmDeclared ?? vgm.vgm !== null,
        })),
      });
      const buffer = await workbook.xlsx.writeBuffer();
      downloadBlob(
        new Blob([buffer], {
          type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        }),
        `${fileName}.xlsx`,
      );
    } catch {
      toast({ body: 'Không xuất được file Excel.', type: 'error' });
    }
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
          sealNumber: vgm.sealNumber || '—',
          depot: depotName(vgm.emptyPickupDepotId) || '—',
          maxGross: weight(vgm.maxGross),
          tare: weight(vgm.tare),
          grossWeight: weight(vgm.grossWeight),
          vgm: weight(vgm.vgm),
          isVgmDeclared: vgm.isVgmDeclared ?? vgm.vgm !== null,
        }))}
        totals={
          vgms.length > 0
            ? {
                label: 'Σ Tổng cộng',
                types: typeMix(' / '),
                grossWeight: `${WEIGHT_FORMATTER.format(summary.grossWeight)} kg`,
                vgm: `${WEIGHT_FORMATTER.format(summary.vgm)} kg`,
              }
            : null
        }
        onExport={handleExport}
        screenshotFileName={fileName}
        onImport={() => setBulkMode('excel')}
        onBulkCreate={() => setBulkMode('table')}
        onCreate={() => setFormDialog({ vgm: null })}
        onEdit={(id) => setFormDialog({ vgm: vgmById(id) })}
        onDelete={(id) => setDeletingVgm(vgmById(id))}
      />

      {/* Drawers and dialogs portal out of the page tree, so they re-apply Meta. */}
      <MetaThemeProvider>
        {bulkMode ? (
          <ShipmentVgmBulkDrawer
            key={bulkMode}
            contractId={contractId}
            shipmentId={shipment.id}
            shipmentCode={shipment.shipmentCode}
            existingNumbers={vgms.map((vgm) => vgm.containerNumber)}
            mode={bulkMode}
            onClose={() => setBulkMode(null)}
          />
        ) : null}
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
          <ShipmentVgmDrawer
            key={formDialog.vgm?.id ?? 'create'}
            contractId={contractId}
            shipmentId={shipment.id}
            shipmentCode={shipment.shipmentCode}
            vgm={formDialog.vgm}
            onClose={() => setFormDialog(null)}
          />
        ) : null}
      </MetaThemeProvider>
    </>
  );
}
