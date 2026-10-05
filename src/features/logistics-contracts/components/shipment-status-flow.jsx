'use client';

import { Button } from '@astryxdesign/core/Button';
import { Card } from '@astryxdesign/core/Card';
import { HStack } from '@astryxdesign/core/HStack';
import { Icon } from '@astryxdesign/core/Icon';
import { Step, Stepper } from '@astryxdesign/core/Stepper';
import { Text } from '@astryxdesign/core/Text';
import { VStack } from '@astryxdesign/core/VStack';
import { ArrowRight } from 'lucide-react';

import { MetaPill } from '@/shared/components/custom/meta/index.js';

import {
  labelForShipmentStatus,
  shipmentStatusFlow,
} from '../config/shipment-status.js';

/**
 * "Tình trạng lô hàng" on the shipment page: the statuses this shipment
 * passes through under its contract's Incoterm, with the current one
 * marked, and "Chuyển sang …" for the next. Moving (or choosing another
 * step) opens the shipment drawer on that stage's groups only
 * (`shipment-staged-form`), so each stage asks for a little information
 * when it actually becomes known. Status stays freely settable.
 * @param {{
 *   incoterm: import('../types/index.js').Incoterm | string,
 *   status: import('../types/index.js').ShipmentStatus,
 *   onMove: (status: import('../types/index.js').ShipmentStatus) => void,
 * }} props
 */
export function ShipmentStatusFlow({ incoterm, status, onMove }) {
  const flow = shipmentStatusFlow(incoterm, status);
  const current = flow.indexOf(status);
  const next = flow[current + 1] ?? null;
  return (
    <Card padding={4}>
      <VStack gap={3} hAlign="stretch">
        <HStack hAlign="between" vAlign="center" gap={3} wrap="wrap">
          <VStack gap={1}>
            <Text weight="bold">Tình trạng lô hàng</Text>
            <Text size="sm" color="secondary">
              Luồng {incoterm} · chọn một bước để chuyển và bổ sung thông tin
              của giai đoạn đó
            </Text>
          </VStack>
          {next ? (
            <Button
              label={`Chuyển sang ${labelForShipmentStatus(next)}`}
              variant="primary"
              icon={<Icon icon={ArrowRight} size="sm" />}
              onClick={() => onMove(next)}
            />
          ) : (
            <MetaPill label="Đã hoàn thành" tone="success" hasDot />
          )}
        </HStack>
        <Stepper
          label="Tình trạng lô hàng"
          density="compact"
          // Completed: every step done, none still active.
          activeStep={next ? current : flow.length}
          onStepClick={(index) => {
            if (index !== current) onMove(flow[index]);
          }}
          horizontalOptions={{
            minimumStepWidth: 96,
            collapsedVariant: 'withLabelAndControls',
          }}
        >
          {flow.map((item, index) => (
            <Step
              key={item}
              step={index}
              label={labelForShipmentStatus(item)}
              description={index === current ? 'Hiện tại' : undefined}
            />
          ))}
        </Stepper>
      </VStack>
    </Card>
  );
}
