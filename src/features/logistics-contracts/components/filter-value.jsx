'use client';

import { HStack } from '@astryxdesign/core/HStack';
import { Text } from '@astryxdesign/core/Text';

/**
 * Figma filter pill for a `Selector`'s `renderValue`: muted caption
 * ("Loại hình:"), bold current value. Shared by the Shipment and Nhà cung
 * cấp list filter bands.
 * @param {string} caption
 */
export function renderFilterValue(caption) {
  return function FilterValue(
    /** @type {{ label?: import('react').ReactNode }} */ option,
  ) {
    return (
      <HStack as="span" gap={1} vAlign="center" wrap="nowrap">
        <Text as="span" type="supporting" weight="medium">
          {caption}
        </Text>
        <Text as="span" type="supporting" weight="semibold" color="primary">
          {option.label}
        </Text>
      </HStack>
    );
  };
}
