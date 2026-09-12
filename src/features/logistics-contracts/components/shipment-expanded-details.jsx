'use client';

import { Button } from '@astryxdesign/core/Button';
import { Divider } from '@astryxdesign/core/Divider';
import { HStack } from '@astryxdesign/core/HStack';
import { Icon } from '@astryxdesign/core/Icon';
import { Tab, TabList } from '@astryxdesign/core/TabList';
import { VStack } from '@astryxdesign/core/VStack';
import { Pencil } from 'lucide-react';
import { useState } from 'react';

import { expandableRowStyles } from '@/shared/components/expandable-row-styles.jsx';

import { ShipmentCostsSection } from './shipment-costs-section.jsx';
import { ShipmentInfoSection } from './shipment-info-section.jsx';
import { ShipmentVgmSection } from './shipment-vgm-section.jsx';

// Only the legacy nested contract panel owns a bounded scroll region.
const EXPANDED_DETAILS_CONTENT_HEIGHT = 480;

/**
 * Shipment details shared by the legacy nested contract panel and fullscreen
 * workspace. A controlled tab delegates navigation/scrolling to the dialog.
 * @param {{
 *   activeTab?: string,
 *   contractId: string,
 *   shipment: import('../types/index.js').Shipment,
 *   supplierName: string,
 *   customersById: Map<string, import('../types/index.js').Customer>,
 *   costCategoriesById: Map<string, import('../types/index.js').ShipmentCostCategory>,
 *   onAddVgm: () => void,
 *   onEditVgm: (vgm: import('../types/index.js').ShipmentVgm) => void,
 *   onEdit?: () => void,
 * }} props
 */
export function ShipmentExpandedDetails({
  activeTab: controlledTab,
  contractId,
  shipment,
  supplierName,
  customersById,
  costCategoriesById,
  onAddVgm,
  onEditVgm,
  onEdit,
}) {
  const [localTab, setActiveTab] = useState('info');
  const activeTab = controlledTab ?? localTab;

  return (
    <VStack
      gap={3}
      hAlign="stretch"
      xstyle={!controlledTab && expandableRowStyles.expandedPanel}
    >
      {!controlledTab ? (
        <TabList value={activeTab} onChange={setActiveTab} hasDivider>
          <Tab value="info" label="Thông tin" />
          <Tab value="vgm" label="VGM" />
          <Tab value="costs" label="Chi phí Logistics" />
        </TabList>
      ) : null}

      <VStack
        gap={4}
        hAlign="stretch"
        height={controlledTab ? undefined : EXPANDED_DETAILS_CONTENT_HEIGHT}
        isScrollable={!controlledTab}
      >
        {activeTab === 'info' ? (
          <ShipmentInfoSection shipment={shipment} supplierName={supplierName} />
        ) : null}

        {activeTab === 'vgm' ? (
          <ShipmentVgmSection
            contractId={contractId}
            shipmentId={shipment.id}
            customersById={customersById}
            onAddVgm={onAddVgm}
            onEditVgm={onEditVgm}
          />
        ) : null}

        {activeTab === 'costs' ? (
          <ShipmentCostsSection
            shipment={shipment}
            customersById={customersById}
            costCategoriesById={costCategoriesById}
          />
        ) : null}
      </VStack>

      {onEdit ? (
        <>
          <Divider />
          <HStack hAlign="end">
            <Button
              label="Sửa Shipment"
              variant="secondary"
              size="sm"
              icon={<Icon icon={Pencil} />}
              onClick={onEdit}
            />
          </HStack>
        </>
      ) : null}
    </VStack>
  );
}
