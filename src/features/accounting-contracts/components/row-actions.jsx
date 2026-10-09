'use client';

import { HStack } from '@astryxdesign/core/HStack';
import { Icon } from '@astryxdesign/core/Icon';
import { IconButton } from '@astryxdesign/core/IconButton';
import { Pencil, Trash2 } from 'lucide-react';

/**
 * Edit / delete buttons at the end of a row.
 * @param {{ name: string, onEdit: () => void, onDelete: () => void }} props
 */
export function RowActions({ name, onEdit, onDelete }) {
  return (
    <HStack gap={1} vAlign="center" hAlign="end">
      <IconButton
        label={`Sửa ${name}`}
        tooltip="Sửa"
        icon={<Icon icon={Pencil} size="sm" />}
        variant="ghost"
        size="sm"
        onClick={onEdit}
      />
      <IconButton
        label={`Xoá ${name}`}
        tooltip="Xoá"
        icon={<Icon icon={Trash2} size="sm" />}
        variant="ghost"
        size="sm"
        onClick={onDelete}
      />
    </HStack>
  );
}
