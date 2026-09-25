'use client';

import { Icon } from '@astryxdesign/core/Icon';
import { StackItem } from '@astryxdesign/core/Stack';
import { pixel, proportional } from '@astryxdesign/core/Table';
import { Text } from '@astryxdesign/core/Text';
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

import { useCountriesQuery } from '../hooks/use-countries-query.js';
import { CountryFormDialog } from './country-form-dialog.jsx';

/** @satisfies {ReadonlyArray<import('@astryxdesign/core/PowerSearch').FieldDefinition>} */
const SEARCH_FIELD_DEFS = [
  { key: 'name', type: 'string', label: 'Tên nước' },
  { key: 'code', type: 'string', label: 'Mã ISO' },
];

const COLUMN_OPTIONS = [
  { key: 'code', label: 'Mã ISO' },
  { key: 'name', label: 'Tên nước', isAlwaysVisible: true },
];

const SKELETON_ROW_COUNT = 6;

const skeletonRows = Array.from({ length: SKELETON_ROW_COUNT }, (_, index) => ({
  id: `skeleton-${index}`,
  name: '',
  code: null,
}));

export function CountriesList() {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [hasOpenedCreate, setHasOpenedCreate] = useState(false);

  const countriesQuery = useCountriesQuery();
  const listResult = countriesQuery.data;
  const countries = listResult?.success ? listResult.countries : [];

  /** @type {import('@astryxdesign/core/Table').TableColumn<import('../types/index.js').Country & Record<string, unknown>>[]} */
  const columns = [
    {
      key: 'code',
      header: 'Mã ISO',
      width: pixel(96),
      filter: 'code',
      renderCell: (country) => (
        <Text weight="medium">
          <MetaCellText value={country.code} />
        </Text>
      ),
    },
    {
      key: 'name',
      header: 'Tên nước',
      width: proportional(1),
      filter: 'name',
      renderCell: (country) => (
        <MetaPrimaryCell>{country.name}</MetaPrimaryCell>
      ),
    },
  ];

  return (
    <VStack gap={4} hAlign="stretch" height="100%">
      {listResult && !listResult.success ? (
        <AdvanceTableErrorBanner message={listResult.message} />
      ) : null}

      <StackItem size="fill">
        <AdvanceTable
          title={
            <MetaListTitle
              title="Danh sách nước xuất khẩu"
              count={listResult?.success ? countries.length : undefined}
              unit="nước"
            />
          }
          isFramed
          isStriped
          dividers="rows"
          primaryAction={{
            label: 'Thêm nước',
            icon: <Icon icon={Plus} size="sm" />,
            onClick: () => {
              setHasOpenedCreate(true);
              setIsCreateOpen(true);
            },
          }}
          toolbarLabel="Thao tác danh sách nước"
          searchFieldDefs={SEARCH_FIELD_DEFS}
          entityLabel="Nước"
          contentSearchFieldKey="name"
          searchPlaceholder="Tìm tên nước..."
          columnOptions={COLUMN_OPTIONS}
          tableColumns={columns}
          data={countries}
          idKey="id"
          isLoading={countriesQuery.isLoading}
          skeletonRows={skeletonRows}
          onRefresh={() => countriesQuery.refetch()}
          isRefreshing={countriesQuery.isFetching}
          defaultStickyEnd="none"
        />
      </StackItem>

      {hasOpenedCreate ? (
        <CountryFormDialog
          isOpen={isCreateOpen}
          onOpenChange={setIsCreateOpen}
          onSuccess={() => setIsCreateOpen(false)}
        />
      ) : null}
    </VStack>
  );
}
