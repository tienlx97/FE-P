'use client';

import { Button } from '@astryxdesign/core/Button';
import { HStack } from '@astryxdesign/core/HStack';
import { Icon } from '@astryxdesign/core/Icon';
import { Text } from '@astryxdesign/core/Text';
import { VStack } from '@astryxdesign/core/VStack';
import * as stylex from '@stylexjs/stylex';
import { ChevronDown, ChevronUp } from 'lucide-react';

import {
  MetaFormSection,
  MetaPill,
} from '@/shared/components/custom/meta/index.js';

import { labelForShipmentStatus } from '../config/shipment-status.js';

/** @typedef {ReturnType<typeof import('../config/shipment-form-sections.js').sectionCompleteness>} Completeness */

/**
 * Pill for a group's completeness, shared by the section header and the
 * outline.
 * @param {{ completeness: Completeness }} props
 */
export function ShipmentSectionStatePill({ completeness }) {
  switch (completeness.state) {
    case 'error':
      return <MetaPill label="Có lỗi" tone="danger" hasDot />;
    case 'complete':
      return <MetaPill label="Đủ" tone="success" hasDot />;
    case 'missing':
      return (
        <MetaPill label={`Còn ${completeness.missing} mục`} tone="muted" />
      );
    default:
      return <MetaPill label="Tuỳ chọn" tone="muted" />;
  }
}

/**
 * One boxed group of the shipment drawer that can be collapsed. A collapsed
 * group keeps its values (they live in the form hook) and shows when it is
 * usually filled in, so a new shipment only asks for booking-time data.
 * @param {{
 *   id: string,
 *   section: import('../config/shipment-form-sections.js').ShipmentFormSection,
 *   index: number,
 *   isOpen: boolean,
 *   onOpenChange: (isOpen: boolean) => void,
 *   completeness: Completeness,
 *   isHidden?: boolean,
 *   children: import('react').ReactNode,
 * }} props `isHidden`: not part of the stage being filled ("Chuyển sang …").
 */
export function ShipmentFormSection({
  id,
  section,
  index,
  isOpen,
  onOpenChange,
  completeness,
  isHidden = false,
  children,
}) {
  if (isHidden) return null;
  const canCollapse = section.id !== 'basic';
  return (
    <VStack id={id} hAlign="stretch" xstyle={styles.anchor}>
      <MetaFormSection
        isBoxed
        isTitleUppercase={false}
        index={index}
        title={section.title}
        action={
          <HStack gap={2} vAlign="center" wrap="nowrap">
            <ShipmentSectionStatePill completeness={completeness} />
            {canCollapse ? (
              <Button
                label={isOpen ? 'Thu gọn' : 'Bổ sung'}
                variant="ghost"
                size="sm"
                type="button"
                icon={
                  <Icon icon={isOpen ? ChevronUp : ChevronDown} size="sm" />
                }
                aria-expanded={isOpen}
                aria-controls={`${id}-body`}
                onClick={() => onOpenChange(!isOpen)}
              />
            ) : null}
          </HStack>
        }
      >
        <VStack id={`${id}-body`} gap={4} hAlign="stretch">
          {isOpen ? (
            children
          ) : (
            <Text size="sm" color="secondary">
              {section.stage && section.stage !== 'Booked'
                ? `Thường có từ giai đoạn “${labelForShipmentStatus(section.stage)}” — có thể bổ sung sau.`
                : 'Không bắt buộc — có thể bổ sung sau.'}
            </Text>
          )}
        </VStack>
      </MetaFormSection>
    </VStack>
  );
}

const styles = stylex.create({
  // Outline jumps land a little below the scroll edge.
  anchor: { scrollMarginTop: 'var(--spacing-4)' },
});
