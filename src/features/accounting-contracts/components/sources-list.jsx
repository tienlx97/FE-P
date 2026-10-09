'use client';

import { Icon } from '@astryxdesign/core/Icon';
import { StackItem } from '@astryxdesign/core/Stack';
import { pixel, proportional } from '@astryxdesign/core/Table';
import { VStack } from '@astryxdesign/core/VStack';
import { Plus } from 'lucide-react';
import { useState } from 'react';

import {
  AdvanceTable,
  AdvanceTableErrorBanner,
} from '@/shared/components/advance-table.jsx';
import {
  MetaCellText,
  MetaListTitle,
  MetaPrimaryCell,
} from '@/shared/components/custom/meta/list-parts.jsx';

import {
  useDeleteSourceMutation,
  useSourcesQuery,
} from '../hooks/use-catalogs.js';
import { ConfirmDeleteDialog } from './confirm-delete-dialog.jsx';
import { RowActions } from './row-actions.jsx';
import { SourceFormDialog } from './source-form-dialog.jsx';

/** @satisfies {ReadonlyArray<import('@astryxdesign/core/PowerSearch').FieldDefinition>} */
const SEARCH_FIELD_DEFS = [
  { key: 'name', type: 'string', label: 'Tên nguồn' },
  { key: 'note', type: 'string', label: 'Ghi chú' },
];

const COLUMN_OPTIONS = [
  { key: 'name', label: 'Tên nguồn', isAlwaysVisible: true },
  { key: 'note', label: 'Ghi chú' },
  { key: 'actions', label: 'Thao tác', isAlwaysVisible: true },
];

/** "Nguồn" catalog: list, create, edit, delete. */
export function SourcesList() {
  const [editing, setEditing] = useState(
    /** @type {import('../types/index.js').AccountingSource | null} */ (null),
  );
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [deleting, setDeleting] = useState(
    /** @type {import('../types/index.js').AccountingSource | null} */ (null),
  );

  const sourcesQuery = useSourcesQuery();
  const deleteMutation = useDeleteSourceMutation();
  const result = sourcesQuery.data;
  const sources = result?.success ? result.data : [];

  /** @param {import('../types/index.js').AccountingSource | null} source */
  function openForm(source) {
    setEditing(source);
    setIsFormOpen(true);
  }

  /** @type {import('@astryxdesign/core/Table').TableColumn<import('../types/index.js').AccountingSource & Record<string, unknown>>[]} */
  const columns = [
    {
      key: 'name',
      header: 'Tên nguồn',
      width: proportional(1),
      filter: 'name',
      renderCell: (source) => <MetaPrimaryCell>{source.name}</MetaPrimaryCell>,
    },
    {
      key: 'note',
      header: 'Ghi chú',
      width: proportional(2),
      filter: 'note',
      renderCell: (source) => <MetaCellText value={source.note} />,
    },
    {
      key: 'actions',
      header: '',
      width: pixel(90),
      renderCell: (source) => (
        <RowActions
          name={source.name}
          onEdit={() => openForm(source)}
          onDelete={() => setDeleting(source)}
        />
      ),
    },
  ];

  return (
    <VStack gap={4} hAlign="stretch" height="100%">
      {result && !result.success ? (
        <AdvanceTableErrorBanner message={result.message} />
      ) : null}

      <StackItem size="fill">
        <AdvanceTable
          title={
            <MetaListTitle
              title="Danh sách nguồn"
              count={result?.success ? sources.length : undefined}
              unit="nguồn"
            />
          }
          isFramed
          isStriped
          dividers="rows"
          primaryAction={{
            label: 'Thêm nguồn',
            icon: <Icon icon={Plus} size="sm" />,
            onClick: () => openForm(null),
          }}
          toolbarLabel="Thao tác danh sách nguồn"
          searchFieldDefs={SEARCH_FIELD_DEFS}
          entityLabel="Nguồn Kế toán"
          contentSearchFieldKey="name"
          searchPlaceholder="Tìm tên nguồn..."
          columnOptions={COLUMN_OPTIONS}
          tableColumns={columns}
          data={sources}
          idKey="id"
          isLoading={sourcesQuery.isLoading}
          onRefresh={() => sourcesQuery.refetch()}
          isRefreshing={sourcesQuery.isFetching}
          defaultStickyEnd="none"
        />
      </StackItem>

      <SourceFormDialog
        isOpen={isFormOpen}
        onOpenChange={setIsFormOpen}
        source={editing}
      />
      <ConfirmDeleteDialog
        title={deleting ? `Xoá nguồn ${deleting.name}?` : null}
        onClose={() => setDeleting(null)}
        onConfirm={() => deleteMutation.mutateAsync(deleting?.id ?? '')}
      />
    </VStack>
  );
}
