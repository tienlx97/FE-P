'use client';

import { HStack } from '@astryxdesign/core/HStack';
import { Icon } from '@astryxdesign/core/Icon';
import { Tooltip } from '@astryxdesign/core/Tooltip';
import { PencilLine } from 'lucide-react';

/**
 * Marks a table value the user typed over the computed one ("Đã sửa tay").
 * @param {{ isTyped: boolean, hAlign?: 'start' | 'end', children: import('react').ReactNode }} props
 */
export function TypedMark({ isTyped, hAlign = 'end', children }) {
  if (!isTyped) return children;
  return (
    <HStack gap={1} vAlign="center" hAlign={hAlign}>
      <Tooltip content="Đã sửa tay">
        <Icon icon={PencilLine} size="sm" color="secondary" />
      </Tooltip>
      {children}
    </HStack>
  );
}
