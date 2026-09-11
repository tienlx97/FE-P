'use client';

import { Tab, TabList } from '@astryxdesign/core/TabList';
import { Text } from '@astryxdesign/core/Text';
import * as stylex from '@stylexjs/stylex';
import { useId, useState } from 'react';

import { FormDialog } from '@/shared/components/form-dialog.jsx';
import { useAppToast } from '@/shared/hooks/use-app-toast.js';

import { useShipmentForm } from '../hooks/use-shipment-form.js';
import { ShipmentFields } from './shipment-fields.jsx';

const styles = stylex.create({
  disabledTab: { cursor: 'not-allowed', opacity: 0.5 },
});

/**
 * Create/edit dialog for one `Contract`'s shipments — one editor, two
 * entrypoints (task 3.2,
 * `openspec/changes/logistics-workspace-redesign/design.md` section 3):
 * `shipments-list.jsx`'s own row, and the Contract dialog's "Liên quan" tab
 * (`contracts-list.jsx`, which also hides its own `ContractFormDialog`
 * while this one is open — `isOpen` toggling doesn't unmount either
 * dialog's content, so the Contract workspace's tab/scroll survives the
 * round trip — and passes `closeLabel="Quay lại Contract"` so the button
 * that returns there says so instead of a bare "Đóng").
 * Pass `shipment` to edit an existing one; omit it
 * to create a new one (its `shipmentNumber`/`shipmentCode` are assigned by
 * the backend on success). Xem and Sửa share the same `ShipmentFields`
 * layout — only `isReadOnly` differs per field — so there is no separate
 * view-only content branch.
 * @param {{
 *   isOpen: boolean,
 *   initialMode?: 'view' | 'edit',
 *   onOpenChange: (isOpen: boolean) => void,
 *   contractId: string,
 *   contract?: import('../types/index.js').Contract | null,
 *   shipment?: import('../types/index.js').Shipment | null,
 *   onSuccess?: (shipment: import('../types/index.js').Shipment) => void,
 *   closeLabel?: string,
 * }} props
 */
export function ShipmentFormDialog({
  isOpen,
  initialMode = 'edit',
  onOpenChange,
  contractId,
  contract = null,
  shipment = null,
  onSuccess,
  closeLabel = 'Đóng',
}) {
  const [mode, setMode] = useState(initialMode);
  const isViewing = mode === 'view' && Boolean(shipment);
  const toast = useAppToast();
  const form = useShipmentForm({
    contractId,
    contract,
    shipment,
    onSuccess: (savedShipment) => {
      toast({
        body: shipment ? 'Đã cập nhật Shipment.' : 'Đã tạo Shipment.',
      });
      // Editing an existing Shipment goes back to Xem in place (tab/scroll
      // stay put) instead of closing; creating one still closes — there is
      // no record yet for the caller to keep the dialog open on (see
      // `onSuccess` at the call sites in `contracts-list.jsx`/
      // `shipments-list.jsx`, which only keep `shipmentDialog` open when it
      // already held a `shipment`).
      if (shipment) setMode('view');
      onSuccess?.(savedShipment);
      if (!shipment) onOpenChange(false);
    },
  });

  /** @param {boolean} nextIsOpen */
  function handleOpenChange(nextIsOpen) {
    if (!nextIsOpen) form.reset();
    onOpenChange(nextIsOpen);
  }

  const [activeTab, setActiveTab] = useState('info');
  const panelId = useId();
  return (
    <FormDialog
      isOpen={isOpen}
      isReadOnly={isViewing}
      onEdit={() => {
        form.reset();
        setMode('edit');
      }}
      onOpenChange={handleOpenChange}
      closeLabel={closeLabel}
      variant="fullscreen"
      title={shipment ? `Shipment · ${shipment.shipmentCode}` : 'Thêm Shipment'}
      submitLabel={shipment ? 'Lưu thay đổi' : 'Tạo Shipment'}
      draft={{ values: form.values, costs: form.costLineRows.rows }}
      isSubmitting={form.isSubmitting}
      submitError={form.submitError}
      fieldStatuses={form.fieldStatuses}
      onSubmit={async (event) => {
        const invalidTab = await form.handleSubmit(event);
        if (invalidTab) setActiveTab(invalidTab);
      }}
      navigation={
        <TabList
          value={activeTab}
          onChange={(tab) => {
            if (tab !== 'vgm' || shipment) setActiveTab(tab);
          }}
          role="tablist"
          hasDivider
        >
          <Tab value="info" label="Thông tin" panelId={panelId} />
          <Tab
            value="vgm"
            label="VGM"
            panelId={panelId}
            aria-disabled={!shipment}
            xstyle={!shipment && styles.disabledTab}
          />
          <Tab value="costs" label="Chi phí Logistics" panelId={panelId} />
        </TabList>
      }
    >
      <Text color="secondary">
        VGM được quản lý sau khi lưu Shipment. Chi phí Logistics được lưu cùng
        Shipment.
      </Text>
      <section
        id={panelId}
        role="tabpanel"
        aria-label={
          activeTab === 'info'
            ? 'Thông tin'
            : activeTab === 'vgm'
              ? 'VGM'
              : 'Chi phí Logistics'
        }
        tabIndex={0}
      >
        <ShipmentFields
          values={form.values}
          setField={form.setField}
          fieldStatuses={form.fieldStatuses}
          customers={form.customers}
          isEditing={shipment != null}
          costLineRows={form.costLineRows}
          contractId={contractId}
          shipmentId={shipment?.id ?? null}
          activeTab={activeTab}
          isReadOnly={isViewing}
        />
      </section>
    </FormDialog>
  );
}
