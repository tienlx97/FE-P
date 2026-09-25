'use client';

import { AlertDialog } from '@astryxdesign/core/AlertDialog';
import { useState } from 'react';

import {
  MetaCostPanel,
  MetaThemeProvider,
} from '@/shared/components/custom/meta/index.js';
import { formatDisplayDate } from '@/shared/config/date-input-format.js';
import { useAppToast } from '@/shared/hooks/use-app-toast.js';

import { formatVndAmount } from '../config/currencies.js';
import {
  costLineFormValues,
  useSaveShipmentCostLines,
} from '../hooks/use-save-shipment-cost-lines.js';
import { ShipmentCostLineDrawer } from './shipment-cost-line-drawer.jsx';

const money = formatVndAmount;

/**
 * Shipment detail "Chi phí logistics" tab (Figma 124:9667): groups the
 * shipment's cost lines under the fixed LOG-01 … LOG-08 categories (all
 * eight, so each group's "+" is always there) and feeds `MetaCostPanel`.
 * "Thêm chi phí", a group's "+" (group pre-selected) and a line's edit
 * open `ShipmentCostLineDrawer` (Figma 125:11995); deleting a line
 * resends the shipment without it.
 *
 * @param {{
 *   contractId: string,
 *   shipment: import('../types/index.js').Shipment,
 *   costCategoriesById: Map<string, import('../types/index.js').ShipmentCostCategory>,
 *   isCategoriesLoading: boolean,
 *   customersById: Map<string, import('../types/index.js').Customer>,
 *   incotermLabel: string,
 * }} props
 */
export function ShipmentCostPanel({
  contractId,
  shipment,
  costCategoriesById,
  isCategoriesLoading,
  customersById,
  incotermLabel,
}) {
  /** Open drawer: a new line (optionally in a group) or an existing one. */
  const [drawer, setDrawer] = useState(
    /** @type {{ costLine: import('../types/index.js').ShipmentCostLine | null, costCategoryId?: string } | null} */ (
      null
    ),
  );
  const [deletingCost, setDeletingCost] = useState(
    /** @type {import('../types/index.js').ShipmentCostLine | null} */ (null),
  );
  const { saveCostLines } = useSaveShipmentCostLines(contractId);
  const toast = useAppToast();

  const categories = [...costCategoriesById.values()].sort((a, b) =>
    a.code.localeCompare(b.code),
  );
  // Lines whose category is missing from the catalog still show, last.
  const orphanCosts = shipment.costs.filter(
    (cost) => !costCategoriesById.has(cost.costCategoryId),
  );

  /** @param {import('../types/index.js').ShipmentCostLine[]} costs */
  const sum = (costs) => costs.reduce((total, cost) => total + cost.amount, 0);

  const groupedCosts = categories.map((category) => ({
    id: category.id,
    label: `${category.code} · ${category.name}`,
    costs: shipment.costs.filter((cost) => cost.costCategoryId === category.id),
  }));
  if (orphanCosts.length > 0) {
    groupedCosts.push({
      id: 'uncategorized',
      label: 'Chưa phân nhóm',
      costs: orphanCosts,
    });
  }
  // STT runs through the groups in display order.
  const numberById = new Map(
    groupedCosts
      .flatMap((group) => group.costs)
      .map((cost, index) => [cost.id, String(index + 1)]),
  );

  const groups = groupedCosts.map((group) => ({
    id: group.id,
    label: group.label,
    subtotal: money(sum(group.costs)),
    rows: group.costs.map((cost) => ({
      id: cost.id,
      no: numberById.get(cost.id) ?? '',
      groupName: costCategoriesById.get(cost.costCategoryId)?.name ?? '—',
      name: cost.name,
      amount: money(cost.amount),
      nature: cost.costNature ?? 'Standard',
      note: cost.note || null,
      provider: cost.providerCustomerId
        ? (customersById.get(cost.providerCustomerId)?.companyName ?? null)
        : null,
      invoiceNumber: cost.invoiceNumber || null,
      invoiceDate: cost.invoiceDate ? formatDisplayDate(cost.invoiceDate) : null,
    })),
  }));

  const total = sum(shipment.costs);
  const abnormal = sum(
    shipment.costs.filter((cost) => cost.costNature === 'Abnormal'),
  );
  const providerCount = new Set(
    shipment.costs.map((cost) => cost.providerCustomerId).filter(Boolean),
  ).size;
  const invoiceCount = new Set(
    shipment.costs.map((cost) => cost.invoiceNumber).filter(Boolean),
  ).size;

  async function handleConfirmDelete() {
    if (!deletingCost) return;
    const result = await saveCostLines(
      shipment,
      shipment.costs
        .filter((cost) => cost.id !== deletingCost.id)
        .map(costLineFormValues),
    );
    setDeletingCost(null);
    toast({
      body: result.success ? 'Đã xoá khoản chi phí.' : result.message,
    });
  }

  return (
    <>
      <MetaCostPanel
        count={shipment.costs.length}
        abnormalTotal={money(abnormal)}
        total={money(total)}
        groups={groups}
        totals={
          shipment.costs.length > 0
            ? {
                lines: `${shipment.costs.length} khoản phí phát sinh`,
                amount: money(total),
                abnormal: `Abnormal: ${money(abnormal)}`,
                providers: `${providerCount} đối tác`,
                invoices: `${invoiceCount} số HĐ`,
              }
            : null
        }
        shipmentCode={shipment.shipmentCode}
        isLoading={isCategoriesLoading}
        onCreate={() => setDrawer({ costLine: null })}
        onCreateInGroup={(groupId) =>
          setDrawer({
            costLine: null,
            costCategoryId: groupId === 'uncategorized' ? undefined : groupId,
          })
        }
        onEdit={(id) =>
          setDrawer({
            costLine: shipment.costs.find((cost) => cost.id === id) ?? null,
          })
        }
        onDelete={(id) =>
          setDeletingCost(shipment.costs.find((cost) => cost.id === id) ?? null)
        }
      />

      {drawer ? (
        <ShipmentCostLineDrawer
          contractId={contractId}
          shipment={shipment}
          costLine={drawer.costLine}
          initialCostCategoryId={drawer.costCategoryId}
          incotermLabel={incotermLabel}
          costCategories={categories}
          providers={[...customersById.values()]}
          onClose={() => setDrawer(null)}
        />
      ) : null}

      {/* Dialogs portal out of the page tree, so they re-apply Meta. */}
      <MetaThemeProvider>
        <AlertDialog
          isOpen={deletingCost !== null}
          onOpenChange={(nextIsOpen) => {
            if (!nextIsOpen) setDeletingCost(null);
          }}
          title={`Xoá chi phí "${deletingCost?.name ?? ''}"?`}
          description="Khoản chi phí sẽ bị xoá khỏi lô hàng. Hành động này không thể hoàn tác."
          actionLabel="Xoá"
          onAction={handleConfirmDelete}
        />
      </MetaThemeProvider>
    </>
  );
}
