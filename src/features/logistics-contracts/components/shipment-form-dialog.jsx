'use client';

import { Tab, TabList } from '@astryxdesign/core/TabList';
import { Text } from '@astryxdesign/core/Text';
import * as stylex from '@stylexjs/stylex';
import { useId, useState } from 'react';

import { FormDialog } from '@/shared/components/form-dialog.jsx';

import { useShipmentForm } from '../hooks/use-shipment-form.js';
import { ShipmentFields } from './shipment-fields.jsx';

const styles = stylex.create({
  disabledTab: { cursor: 'not-allowed', opacity: 0.5 },
});

/**
 * Create/edit dialog for one `Contract`'s shipments — opened from
 * `ContractExpandedDetails`'s "Shipment" tab (`contracts-list.jsx`).
 * Pass `shipment` to edit an existing one; omit it
 * to create a new one (its `shipmentNumber`/`shipmentCode` are assigned by
 * the backend on success).
 * @param {{
 *   isOpen: boolean,
 *   onOpenChange: (isOpen: boolean) => void,
 *   contractId: string,
 *   contract?: import('../types/index.js').Contract | null,
 *   shipment?: import('../types/index.js').Shipment | null,
 *   onSuccess?: (shipment: import('../types/index.js').Shipment) => void,
 * }} props
 */
export function ShipmentFormDialog({
  isOpen,
  onOpenChange,
  contractId,
  contract = null,
  shipment = null,
  onSuccess,
}) {
  const form = useShipmentForm({
    contractId,
    contract,
    shipment,
    onSuccess: (savedShipment) => {
      onOpenChange(false);
      onSuccess?.(savedShipment);
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
      onOpenChange={handleOpenChange}
      variant="fullscreen"
      title={
        shipment ? `Sửa Shipment ${shipment.shipmentCode}` : 'Thêm Shipment'
      }
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
      {!shipment ? (
        <Text color="secondary">
          Lưu Shipment trước khi thêm VGM. Chi phí Logistics được lưu cùng
          Shipment.
        </Text>
      ) : null}
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
        />
      </section>
    </FormDialog>
  );
}
