'use client';

import { HStack } from '@astryxdesign/core/HStack';
import { Text } from '@astryxdesign/core/Text';
import { Container, Save } from 'lucide-react';

import {
  MetaFormSection,
  MetaPill,
} from '@/shared/components/custom/meta/index.js';
import { MetaFormDrawer } from '@/shared/components/meta-form-drawer.jsx';
import { useAppToast } from '@/shared/hooks/use-app-toast.js';

import { labelForShipmentContainerType } from '../config/shipment-container-types.js';
import { useShipmentVgmForm } from '../hooks/use-shipment-vgm-form.js';
import {
  ShipmentVgmAdditionalFields,
  ShipmentVgmContainerFields,
  ShipmentVgmDeclarationFields,
} from './shipment-vgm-fields.jsx';

/**
 * Create / edit one container of a Shipment (`MetaFormDrawer`): three boxed
 * groups — Container, Khai VGM, Thời gian & ghi chú. Pass `vgm` to edit;
 * omit it to create. Rendered open; the caller mounts / unmounts it.
 * @param {{
 *   contractId: string,
 *   shipmentId: string,
 *   shipmentCode?: string,
 *   vgm?: import('../types/index.js').ShipmentVgm | null,
 *   onClose: () => void,
 *   onSuccess?: (vgm: import('../types/index.js').ShipmentVgm) => void,
 * }} props
 */
export function ShipmentVgmDrawer({
  contractId,
  shipmentId,
  shipmentCode,
  vgm = null,
  onClose,
  onSuccess,
}) {
  const toast = useAppToast();
  const form = useShipmentVgmForm({
    contractId,
    shipmentId,
    vgm,
    onSuccess: (savedVgm) => {
      toast({ body: vgm ? 'Đã cập nhật container.' : 'Đã thêm container.' });
      onClose();
      onSuccess?.(savedVgm);
    },
  });
  const fieldProps = {
    values: form.values,
    setField: form.setField,
    fieldStatuses: form.fieldStatuses,
  };
  const isDeclared = vgm ? (vgm.isVgmDeclared ?? vgm.vgm !== null) : false;

  return (
    <MetaFormDrawer
      onClose={onClose}
      icon={Container}
      title={vgm ? `Sửa container ${vgm.containerNumber}` : 'Thêm container'}
      meta={
        vgm || shipmentCode ? (
          <HStack gap={2} vAlign="center" wrap="wrap">
            {shipmentCode ? (
              <Text size="sm" weight="bold" color="accent" type="code">
                {shipmentCode}
              </Text>
            ) : null}
            {vgm ? (
              <>
                <MetaPill
                  label={`#${vgm.sequenceNumber} · ${labelForShipmentContainerType(vgm.containerType)}`}
                  tone="neutral"
                />
                <MetaPill
                  label={isDeclared ? 'Đã khai VGM' : 'Chưa khai VGM'}
                  tone={isDeclared ? 'success' : 'neutral'}
                  hasDot={isDeclared}
                />
              </>
            ) : null}
          </HStack>
        ) : undefined
      }
      width={720}
      draft={form.values}
      submitLabel={vgm ? 'Lưu thay đổi' : 'Thêm container'}
      submitIcon={Save}
      isSubmitting={form.isSubmitting}
      submitError={form.submitError}
      onSubmit={form.handleSubmit}
    >
      <MetaFormSection
        isBoxed
        isTitleUppercase={false}
        index={1}
        title="Container"
        meta="Bắt buộc: số và loại cont · tự điền từ BIC BoxTech khi có"
      >
        <ShipmentVgmContainerFields {...fieldProps} depots={form.depots} />
      </MetaFormSection>

      <MetaFormSection
        isBoxed
        isTitleUppercase={false}
        index={2}
        title="Khai VGM"
        meta="Sau khi đóng hàng"
      >
        <ShipmentVgmDeclarationFields
          {...fieldProps}
          customers={form.customers}
          hasContainerWeights={false}
        />
      </MetaFormSection>

      <MetaFormSection
        isBoxed
        isTitleUppercase={false}
        index={3}
        title="Thời gian & ghi chú"
        meta="Tuỳ chọn"
      >
        <ShipmentVgmAdditionalFields {...fieldProps} />
      </MetaFormSection>
    </MetaFormDrawer>
  );
}
