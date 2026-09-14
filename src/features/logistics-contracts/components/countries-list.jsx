'use client';

import { Button } from '@astryxdesign/core/Button';
import { HStack } from '@astryxdesign/core/HStack';
import { StackItem } from '@astryxdesign/core/Stack';
import { proportional } from '@astryxdesign/core/Table';
import { Heading } from '@astryxdesign/core/Text';
import { VStack } from '@astryxdesign/core/VStack';
import { useState } from 'react';

import {
  AdvanceTable,
  AdvanceTableErrorBanner,
} from '@/shared/components/advance-table.jsx';

import { useCountriesQuery } from '../hooks/use-countries-query.js';
import { CountryFormDialog } from './country-form-dialog.jsx';

/** @satisfies {ReadonlyArray<import('@astryxdesign/core/PowerSearch').FieldDefinition>} */
const SEARCH_FIELD_DEFS = [{ key: 'name', type: 'string', label: 'Tên nước' }];

const COLUMN_OPTIONS = [
  { key: 'name', label: 'Tên nước', isAlwaysVisible: true },
];

const SKELETON_ROW_COUNT = 6;

const skeletonRows = Array.from({ length: SKELETON_ROW_COUNT }, (_, index) => ({
  id: `skeleton-${index}`,
  name: '',
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
      key: 'name',
      header: 'Tên nước',
      width: proportional(1),
      filter: 'name',
      renderCell: (country) => country.name,
    },
  ];

  return (
    <VStack gap={4} hAlign="stretch" height="100%">
      <HStack hAlign="between" vAlign="center" wrap="wrap" gap={3}>
        <Heading level={1}>Nước xuất khẩu</Heading>
        <Button
          label="Thêm nước"
          variant="primary"
          onClick={() => {
            setHasOpenedCreate(true);
            setIsCreateOpen(true);
          }}
        />
      </HStack>

      {listResult && !listResult.success ? (
        <AdvanceTableErrorBanner message={listResult.message} />
      ) : null}

      <StackItem size="fill">
        <AdvanceTable
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
