'use client';

import { HStack } from '@astryxdesign/core/HStack';
import { Icon } from '@astryxdesign/core/Icon';
import { Selector } from '@astryxdesign/core/Selector';
import { StackItem } from '@astryxdesign/core/Stack';
import { proportional } from '@astryxdesign/core/Table';
import { Text } from '@astryxdesign/core/Text';
import { VStack } from '@astryxdesign/core/VStack';
import { Plus } from 'lucide-react';
import { useMemo, useState } from 'react';

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
      renderCell: (place) => <MetaPrimaryCell>{place.name}</MetaPrimaryCell>,
    },
    {
      key: 'countryName',
      header: 'Nước',
      width: proportional(1),
      filter: 'countryName',
      renderCell: (place) => (
        <MetaCellText value={countriesById.get(place.countryId)?.name} />
      ),
    },
  ];

  // Meta filter pill in the table toolbar (same as the Shipment list's
  // "Loại hình:" band): muted caption, bold current country.
  const countryFilterPill = (
    <Selector
      label="Lọc theo nước"
      isLabelHidden
      size="lg"
      hasSearch
      value={countryFilter || 'all'}
      onChange={(value) =>
        setCountryFilter(value == null || value === 'all' ? '' : value)
      }
      options={[
        { value: 'all', label: 'Tất cả' },
        ...countries.map((country) => ({
          value: country.id,
          label: country.name,
        })),
      ]}
      renderValue={(option) => (
        <HStack as="span" gap={1} vAlign="center" wrap="nowrap">
          <Text as="span" type="supporting" weight="medium">
            Nước:
          </Text>
          <Text as="span" type="supporting" weight="semibold" color="primary">
            {option.label}
          </Text>
        </HStack>
      )}
    />
  );

  return (
    <VStack gap={4} hAlign="stretch" height="100%">
      {listResult && !listResult.success ? (
        <AdvanceTableErrorBanner message={listResult.message} />
      ) : null}

      <StackItem size="fill">
        <AdvanceTable
          title={
            <MetaListTitle
              title="Danh sách cảng / nơi"
              count={listResult?.success ? places.length : undefined}
              unit="cảng / nơi"
            />
          }
          isFramed
          isStriped
          dividers="rows"
          toolbarFilters={countryFilterPill}
          primaryAction={{
            label: 'Thêm cảng / nơi đến',
            icon: <Icon icon={Plus} size="sm" />,
            onClick: () => {
              setHasOpenedCreate(true);
              setIsCreateOpen(true);
            },
          }}
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
