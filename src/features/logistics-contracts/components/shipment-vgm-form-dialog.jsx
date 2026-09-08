'use client';
import { CollapsibleGroup } from '@astryxdesign/core/Collapsible';
import { useToast } from '@astryxdesign/core/Toast';
import { VStack } from '@astryxdesign/core/VStack';

import { FormDialog } from '@/shared/components/form-dialog.jsx';
import { FormSection } from '@/shared/components/form-section.jsx';

import { useShipmentVgmForm } from '../hooks/use-shipment-vgm-form.js';
import {
  ShipmentVgmAdditionalFields,
  ShipmentVgmFields,
} from './shipment-vgm-fields.jsx';

export const SHIPMENT_VGM_FORM_DIALOG_WIDTH = 760;

/**
 * Create/edit dialog for one `Shipment`'s VGM records — opened from
 * `ShipmentExpandedDetails`'s inline VGM table (itself nested in the
 * Contract's "Shipment" tab, `contracts-list.jsx`). Pass `vgm` to edit an
 * existing one; omit it to create a new one.
 *
 * Two collapsed cards (2026-09-03 follow-up, matching `ContractFormDialog`'s
 * layout), both open by default: the required container/weight fields, then
 * "Thông tin bổ sung" for the optional schedule/arrival times and note.
 * @param {{
 *   isOpen: boolean,
 *   onOpenChange: (isOpen: boolean) => void,
 *   contractId: string,
 *   shipmentId: string,
 *   vgm?: import('../types/index.js').ShipmentVgm | null,
 *   onSuccess?: (vgm: import('../types/index.js').ShipmentVgm) => void,
 * }} props
 */
export function ShipmentVgmFormDialog({
  isOpen,
  onOpenChange,
  contractId,
  shipmentId,
  vgm = null,
  onSuccess,
}) {
  const toast = useToast();
  const form = useShipmentVgmForm({
    contractId,
    shipmentId,
    vgm,
    onSuccess: (savedVgm) => {
      toast({ body: vgm ? 'Đã cập nhật VGM.' : 'Đã thêm VGM.' });
      onOpenChange(false);
      onSuccess?.(savedVgm);
    },
  });

  /** @param {boolean} nextIsOpen */
  function handleOpenChange(nextIsOpen) {
    if (!nextIsOpen) form.reset();
    onOpenChange(nextIsOpen);
  }

  return (
    <FormDialog
      isOpen={isOpen}
      onOpenChange={handleOpenChange}
      title={vgm ? `Sửa VGM ${vgm.containerNumber}` : 'Thêm VGM'}
      submitLabel={vgm ? 'Lưu thay đổi' : 'Thêm VGM'}
      width={SHIPMENT_VGM_FORM_DIALOG_WIDTH}
      draft={form.values}
      isSubmitting={form.isSubmitting}
      submitError={form.submitError}
      fieldStatuses={form.fieldStatuses}
      onSubmit={form.handleSubmit}
    >
      <CollapsibleGroup
        type="multiple"
        defaultValue={['main', 'additional']}
        value={
          Object.values(form.fieldStatuses).some(Boolean)
            ? ['main', 'additional']
            : undefined
        }
      >
        <VStack gap={3} hAlign="stretch">
          <FormSection value="main" title="Thông tin container">
            <ShipmentVgmFields
              values={form.values}
              setField={form.setField}
              fieldStatuses={form.fieldStatuses}
              customers={form.customers}
            />
          </FormSection>

          <FormSection value="additional" title="Thông tin bổ sung">
            <ShipmentVgmAdditionalFields
              values={form.values}
              setField={form.setField}
              fieldStatuses={form.fieldStatuses}
            />
          </FormSection>
        </VStack>
      </CollapsibleGroup>
    </FormDialog>
  );
}
