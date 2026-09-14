'use client';

import { Button } from '@astryxdesign/core/Button';
import { HStack } from '@astryxdesign/core/HStack';
import { Selector } from '@astryxdesign/core/Selector';
import { StackItem } from '@astryxdesign/core/Stack';
import { proportional } from '@astryxdesign/core/Table';
import { Heading } from '@astryxdesign/core/Text';
import { VStack } from '@astryxdesign/core/VStack';
import { useMemo, useState } from 'react';

import {
  AdvanceTable,
  AdvanceTableErrorBanner,
} from '@/shared/components/advance-table.jsx';

import { useCountriesQuery } from '../hooks/use-countries-query.js';
import { usePlacesQuery } from '../hooks/use-places-query.js';
import { PlaceFormDialog } from './place-form-dialog.jsx';

/** @satisfies {ReadonlyArray<import('@astryxdesign/core/PowerSearch').FieldDefinition>} */
const SEARCH_FIELD_DEFS = [
  { key: 'name', type: 'string', label: 'Tên cảng / nơi' },
  { key: 'countryName', type: 'string', label: 'Nước' },
];

const COLUMN_OPTIONS = [
  { key: 'name', label: 'Tên cảng / nơi', isAlwaysVisible: true },
  { key: 'countryName', label: 'Nước' },
];

const SKELETON_ROW_COUNT = 6;

const skeletonRows = Array.from({ length: SKELETON_ROW_COUNT }, (_, index) => ({
  id: `skeleton-${index}`,
  name: '',
  countryId: '',
  countryName: '',
}));

export function PlacesList() {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [hasOpenedCreate, setHasOpenedCreate] = useState(false);
  const [countryFilter, setCountryFilter] = useState('');

  const countriesQuery = useCountriesQuery();
  const countriesData = countriesQuery.data;
  const countries = useMemo(
    () => (countriesData?.success ? countriesData.countries : []),
    [countriesData],
  );
  const countriesById = useMemo(
    () => new Map(countries.map((country) => [country.id, country])),
    [countries],
  );

  const placesQuery = usePlacesQuery({ countryId: countryFilter || undefined });
  const listResult = placesQuery.data;
  const places = listResult?.success ? listResult.places : [];
  const searchablePlaces = places.map((place) => ({
    ...place,
    countryName: countriesById.get(place.countryId)?.name ?? '',
  }));

  /** @type {import('@astryxdesign/core/Table').TableColumn<import('../types/index.js').Place & Record<string, unknown>>[]} */
  const columns = [
    {
      key: 'name',
      header: 'Tên cảng / nơi',
      width: proportional(1.2),
      filter: 'name',
      renderCell: (place) => place.name,
    },
    {
      key: 'countryName',
      header: 'Nước',
      width: proportional(1),
      filter: 'countryName',
      renderCell: (place) => countriesById.get(place.countryId)?.name ?? '—',
    },
  ];

  return (
    <VStack gap={4} hAlign="stretch" height="100%">
      <HStack hAlign="between" vAlign="center" wrap="wrap" gap={3}>
        <Heading level={1}>Cảng / Nơi</Heading>
        <Button
          label="Thêm cảng / nơi đến"
          variant="primary"
          onClick={() => {
            setHasOpenedCreate(true);
            setIsCreateOpen(true);
          }}
        />
      </HStack>

      <Selector
        label="Lọc theo nước"
        hasSearch
        hasClear
        placeholder="Tất cả các nước"
        value={countryFilter || null}
        onChange={(value) => setCountryFilter(value ?? '')}
        options={countries.map((country) => ({
          value: country.id,
          label: country.name,
        }))}
        width={280}
      />

      {listResult && !listResult.success ? (
        <AdvanceTableErrorBanner message={listResult.message} />
      ) : null}

      <StackItem size="fill">
        <AdvanceTable
          toolbarLabel="Thao tác danh sách cảng"
          searchFieldDefs={SEARCH_FIELD_DEFS}
          entityLabel="Cảng / Nơi"
          contentSearchFieldKey="name"
          searchPlaceholder="Tìm tên cảng..."
          columnOptions={COLUMN_OPTIONS}
          tableColumns={columns}
          data={searchablePlaces}
          idKey="id"
          isLoading={placesQuery.isLoading}
          skeletonRows={skeletonRows}
          onRefresh={() => placesQuery.refetch()}
          isRefreshing={placesQuery.isFetching}
          defaultStickyEnd="none"
        />
      </StackItem>

      {hasOpenedCreate ? (
        <PlaceFormDialog
          isOpen={isCreateOpen}
          onOpenChange={setIsCreateOpen}
          countries={countries}
          onSuccess={() => setIsCreateOpen(false)}
        />
      ) : null}
    </VStack>
  );
}
