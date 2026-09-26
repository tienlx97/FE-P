'use client';

import { HStack } from '@astryxdesign/core/HStack';
import { Icon } from '@astryxdesign/core/Icon';
import { Selector } from '@astryxdesign/core/Selector';
import { StackItem } from '@astryxdesign/core/Stack';
import { pixel, proportional } from '@astryxdesign/core/Table';
import { Text } from '@astryxdesign/core/Text';
import { VStack } from '@astryxdesign/core/VStack';
import * as stylex from '@stylexjs/stylex';
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

import { searchPorts } from '../api/ports.js';
import { useCountriesQuery } from '../hooks/use-countries-query.js';
import { useSearchPortsQuery } from '../hooks/use-ports-query.js';
import { PortFormDialog } from './port-form-dialog.jsx';

/** @satisfies {ReadonlyArray<import('@astryxdesign/core/PowerSearch').FieldDefinition>} */
const SEARCH_FIELD_DEFS = [
  { key: 'searchText', type: 'string', label: 'Tên / mã cảng' },
  { key: 'name', type: 'string', label: 'Tên ngắn' },
  { key: 'code', type: 'string', label: 'Mã UN/LOCODE' },
  { key: 'fullName', type: 'string', label: 'Tên đầy đủ' },
  { key: 'subdivision', type: 'string', label: 'Vùng' },
];

/** @satisfies {ReadonlyArray<import('@/shared/components/advanced-filter-builder.jsx').AdvancedFilterFieldDef>} */
const FILTER_FIELD_DEFS = [
  { key: 'code', label: 'Mã UN/LOCODE', type: 'string' },
  { key: 'name', label: 'Tên ngắn', type: 'string' },
  { key: 'fullName', label: 'Tên đầy đủ', type: 'string' },
  { key: 'subdivision', label: 'Vùng', type: 'string' },
];

const COLUMN_OPTIONS = [
  { key: 'code', label: 'Mã UN/LOCODE', isAlwaysVisible: true },
  { key: 'name', label: 'Tên ngắn', isAlwaysVisible: true },
  { key: 'fullName', label: 'Tên đầy đủ' },
  { key: 'countryName', label: 'Nước' },
  { key: 'subdivision', label: 'Vùng' },
  { key: 'coordinates', label: 'Toạ độ' },
];

const DEFAULT_PAGE_SIZE = 25;
const PAGE_SIZE_OPTIONS = ['25', '50', '100'];

const skeletonRows = Array.from({ length: 6 }, (_, index) => ({
  id: `skeleton-${index}`,
  code: '',
  name: '',
  fullName: null,
  subdivision: null,
  coordinates: null,
  function: null,
  countryId: '',
  countryName: '',
  searchText: '',
}));

const styles = stylex.create({
  // UN/LOCODEs read as one token.
  nowrap: {
    whiteSpace: 'nowrap',
  },
});

/**
 * "Cảng đến" catalog page (BE-kt-xnk `port-catalog-unlocode`): every
 * UN/LOCODE seaport (~17.5k) plus user-added ones, so it pages and filters
 * on the server (`POST /ports/search`) — country pill + quick search +
 * advanced filter — instead of loading the whole list.
 */
export function PortsList() {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [hasOpenedCreate, setHasOpenedCreate] = useState(false);
  const [countryFilter, setCountryFilter] = useState('');
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [pageIndex, setPageIndex] = useState(1);
  const [searchText, setSearchText] = useState('');
  const [filterConditions, setFilterConditions] = useState(
    /** @type {import('@/shared/components/advanced-filter-builder.jsx').AdvancedFilterCondition[]} */ ([]),
  );

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

  // Quick search matches name OR code OR full name. The BE folds connectors
  // left to right, so this OR group goes first and every later `And`
  // (advanced filter, country pill) narrows the whole group.
  const text = searchText.trim();
  /** @type {import('@/shared/components/advanced-filter-builder.jsx').AdvancedFilterCondition[]} */
  const quickSearchConditions = text
    ? ['name', 'code', 'fullName'].map((field, index) => ({
        id: `quick-search-${field}`,
        field,
        operator: 'Contains',
        value: text,
        valueTo: '',
        connector: /** @type {'And' | 'Or'} */ (index === 0 ? 'And' : 'Or'),
      }))
    : [];
  const searchConditions = [
    ...quickSearchConditions,
    ...filterConditions.map((condition, index) =>
      index === 0 && quickSearchConditions.length > 0
        ? { ...condition, connector: /** @type {const} */ ('And') }
        : condition,
    ),
    ...(countryFilter
      ? [
          {
            id: 'quick-countryId',
            field: 'countryId',
            operator: 'Equals',
            value: countryFilter,
            valueTo: '',
            connector: /** @type {const} */ ('And'),
          },
        ]
      : []),
  ];

  const portsQuery = useSearchPortsQuery({
    page: pageIndex,
    pageSize,
    conditions: searchConditions,
  });
  const listResult = portsQuery.data;
  const totalPorts = listResult?.success ? listResult.totalCount : 0;
  const totalPages = Math.max(
    1,
    listResult?.success ? listResult.totalPages : 1,
  );

  /** @param {import('../types/index.js').Port[]} ports */
  function enrichPorts(ports) {
    return ports.map((port) => ({
      ...port,
      countryName: countriesById.get(port.countryId)?.name ?? '',
      // Quick-search key: the table's own client filter on the fetched page
      // must keep rows the server matched by code or full name too.
      searchText: [port.name, port.code, port.fullName]
        .filter(Boolean)
        .join(' '),
    }));
  }

  const rows = enrichPorts(listResult?.success ? listResult.ports : []);

  // "Xuất toàn bộ dữ liệu": pages through every match (BE caps pageSize at 100).
  async function fetchAllPorts() {
    /** @type {import('../types/index.js').Port[]} */
    const all = [];
    for (let page = 1; ; page += 1) {
      const result = await searchPorts({
        page,
        pageSize: 100,
        conditions: searchConditions,
      });
      if (!result.success) break;
      all.push(...result.ports);
      if (page >= result.totalPages) break;
    }
    return enrichPorts(all);
  }

  /** @type {import('@astryxdesign/core/Table').TableColumn<import('../types/index.js').Port & Record<string, unknown>>[]} */
  const columns = [
    {
      key: 'code',
      header: 'Mã UN/LOCODE',
      width: pixel(140),
      filter: 'code',
      renderCell: (port) => (
        <Text weight="medium" hasTabularNumbers xstyle={styles.nowrap}>
          {port.code ?? 'Nhà máy / Kho'}
        </Text>
      ),
    },
    {
      key: 'name',
      header: 'Tên ngắn',
      width: proportional(1),
      filter: 'name',
      renderCell: (port) => <MetaPrimaryCell>{port.name}</MetaPrimaryCell>,
    },
    {
      key: 'fullName',
      header: 'Tên đầy đủ',
      width: proportional(1.6),
      filter: 'fullName',
      renderCell: (port) => <MetaCellText value={port.fullName} />,
    },
    {
      key: 'countryName',
      header: 'Nước',
      width: proportional(0.8),
      renderCell: (port) => (
        <MetaCellText value={countriesById.get(port.countryId)?.name} />
      ),
    },
    {
      key: 'subdivision',
      header: 'Vùng',
      width: pixel(80),
      filter: 'subdivision',
      renderCell: (port) => <MetaCellText value={port.subdivision} />,
    },
    {
      key: 'coordinates',
      header: 'Toạ độ',
      width: pixel(140),
      renderCell: (port) => (
        <Text hasTabularNumbers xstyle={styles.nowrap}>
          <MetaCellText value={port.coordinates} />
        </Text>
      ),
    },
  ];

  const countryFilterPill = (
    <Selector
      label="Lọc theo nước"
      isLabelHidden
      size="lg"
      hasSearch
      value={countryFilter || 'all'}
      onChange={(value) => {
        setCountryFilter(value == null || value === 'all' ? '' : value);
        setPageIndex(1);
      }}
      options={[
        { value: 'all', label: 'Tất cả' },
        ...countries.map((country) => ({
          value: country.id,
          label: country.code
            ? `${country.name} (${country.code})`
            : country.name,
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
              title="Danh sách cảng đến"
              count={listResult?.success ? totalPorts : undefined}
              unit="cảng"
            />
          }
          isFramed
          isStriped
          dividers="rows"
          toolbarFilters={countryFilterPill}
          primaryAction={{
            label: 'Thêm cảng đến',
            icon: <Icon icon={Plus} size="sm" />,
            onClick: () => {
              setHasOpenedCreate(true);
              setIsCreateOpen(true);
            },
          }}
          toolbarLabel="Thao tác danh sách cảng đến"
          searchFieldDefs={SEARCH_FIELD_DEFS}
          entityLabel="Cảng đến"
          contentSearchFieldKey="searchText"
          onContentSearchChange={(value) => {
            setSearchText(value);
            setPageIndex(1);
          }}
          searchPlaceholder="Tìm tên hoặc mã cảng..."
          filterFieldDefs={FILTER_FIELD_DEFS}
          advancedFilterConditions={filterConditions}
          onAdvancedFilterChange={(conditions) => {
            setFilterConditions(conditions);
            setPageIndex(1);
          }}
          columnOptions={COLUMN_OPTIONS}
          tableColumns={columns}
          data={rows}
          idKey="id"
          isLoading={portsQuery.isLoading}
          skeletonRows={skeletonRows}
          fetchAllRows={fetchAllPorts}
          onRefresh={() => portsQuery.refetch()}
          isRefreshing={portsQuery.isFetching}
          defaultStickyEnd="none"
          pagination={{
            pageIndex,
            pageSize,
            totalCount: totalPorts,
            totalPages,
            onPageIndexChange: setPageIndex,
            onPageSizeChange: setPageSize,
            pageSizeOptions: PAGE_SIZE_OPTIONS,
          }}
        />
      </StackItem>

      {hasOpenedCreate ? (
        <PortFormDialog
          isOpen={isCreateOpen}
          onOpenChange={setIsCreateOpen}
          countries={countries}
          onSuccess={() => setIsCreateOpen(false)}
        />
      ) : null}
    </VStack>
  );
}
