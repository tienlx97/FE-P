'use client';

import { DropdownMenu } from '@astryxdesign/core/DropdownMenu';
import { HStack } from '@astryxdesign/core/HStack';

/** @param {{ onView: () => void, onEdit: () => void }} props */
export function RecordActionsMenu({ onView, onEdit }) {
  return (
    <HStack
      onClick={(event) => event.stopPropagation()}
      onKeyDown={(event) => event.stopPropagation()}
    >
      <DropdownMenu
        button={{ label: 'Chức năng', variant: 'ghost', size: 'sm' }}
        alignment="end"
        items={[
          { label: 'Xem', onClick: onView },
          { label: 'Sửa', onClick: onEdit },
        ]}
      />
    </HStack>
  );
}
