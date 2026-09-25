'use client';

import { Button } from '@astryxdesign/core/Button';
import { HStack } from '@astryxdesign/core/HStack';
import { Icon } from '@astryxdesign/core/Icon';
import { IconButton } from '@astryxdesign/core/IconButton';
import { Link } from '@astryxdesign/core/Link';
import { pixel, proportional } from '@astryxdesign/core/Table';
import { Text } from '@astryxdesign/core/Text';
import { VStack } from '@astryxdesign/core/VStack';
import * as stylex from '@stylexjs/stylex';
import { Download, Eye, Search, Ship } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import {
  MetaCellText,
  MetaPagination,
  MetaPill,
  MetaShipmentSection,
} from '@/shared/components/custom/meta/index.js';
import { TanStackDataTable } from '@/shared/components/tanstack-data-table.jsx';
import { TextInput } from '@/shared/components/text-input.jsx';
import { formatDisplayDate } from '@/shared/config/date-input-format.js';
import { useAppToast } from '@/shared/hooks/use-app-toast.js';

import { searchAllShipments } from '../api/shipments.js';
import { formatVndAmount } from '../config/currencies.js';
import {
  labelForShipmentStatus,
  metaToneForShipmentStatus,
} from '../config/shipment-status.js';
import {
  supplierShipmentConditions,
  useSupplierShipmentsQuery,
} from '../hooks/use-suppliers-query.js';

const PAGE_SIZE = 10;

/**
 * Roles a supplier can play on a shipment — the same three links the
 * backend's `involvedSupplierId` filter matches.
 * @type {Record<string, { label: string, tone: 'accent' | 'neutral' | 'indigo' | 'muted' }>}
 */
const ROLES = {
  forwarder: { label: 'Forwarder', tone: 'accent' },
  Trucking: { label: 'Đơn vị trucking', tone: 'neutral' },
  CustomsBroker: { label: 'Đại lý hải quan', tone: 'indigo' },
  cost: { label: 'Nhà cung cấp chi phí', tone: 'muted' },
};

/**
 * @param {import('../types/index.js').Shipment} shipment
 * @param {string} supplierId
 */
function supplierRoles(shipment, supplierId) {
  const roles = [];
  if (shipment.supplierCustomerId === supplierId) roles.push('forwarder');
  for (const provider of shipment.serviceProviders ?? []) {
    if (provider.supplierId === supplierId && !roles.includes(provider.role)) {
      roles.push(provider.role);
    }
  }
  const hasCost = shipment.costs.some(
    (cost) => cost.providerCustomerId === supplierId,
  );
  if (hasCost && roles.length === 0) roles.push('cost');
  return roles;
}

/**
 * The supplier's share of a shipment's logistics costs (VNĐ): its own cost
 * lines. `null` when none of the lines are billed by it.
 * @param {import('../types/index.js').Shipment} shipment
 * @param {string} supplierId
 */
function supplierCost(shipment, supplierId) {
  const lines = shipment.costs.filter(
    (cost) => cost.providerCustomerId === supplierId,
  );
  return lines.length === 0
    ? null
    : lines.reduce((sum, cost) => sum + cost.amount, 0);
}

/** `shipmentCode` is `{contractNumber}/LOT-01` — the contract part. */
function contractNumberOf(/** @type {string} */ shipmentCode) {
  const slash = shipmentCode.lastIndexOf('/');
  return slash === -1 ? shipmentCode : shipmentCode.slice(0, slash);
}

/**
 * @param {import('../types/index.js').Shipment} shipment
 * @param {string} supplierId
 */
function toRow(shipment, supplierId) {
  return {
    id: shipment.id,
    contractId: shipment.contractId,
    shipmentCode: shipment.shipmentCode,
    contractNumber: contractNumberOf(shipment.shipmentCode),
    roles: supplierRoles(shipment, supplierId),
    etd: shipment.etd,
    eta: shipment.eta,
    status: shipment.status,
    cost: supplierCost(shipment, supplierId),
  };
}

/** @typedef {ReturnType<typeof toRow>} SupplierShipmentRow */

/**
 * Supplier detail "Shipment" tab (Figma "TAB CONTENT - SHIPMENT ACTIVE",
 * node 145:740): shipments the supplier takes part in, searchable by
 * booking / contract / lot name, with its role(s), ETD / ETA, status and
 * its own cost lines' total; a totals row over the rows shown; Excel
 * export of every match.
 * @param {{ supplierId: string, supplierName: string }} props
 */
export function SupplierShipmentsPanel({ supplierId, supplierName }) {
  const router = useRouter();
  const toast = useAppToast();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [isExporting, setIsExporting] = useState(false);
  const query = useSupplierShipmentsQuery(supplierId, {
    page,
    pageSize: PAGE_SIZE,
    search,
  });
  const result = query.data;
  const shipments = result?.success ? result.shipments : [];
  const totalCount = result?.success ? result.totalCount : 0;
  const totalPages = Math.max(1, result?.success ? result.totalPages : 1);
  const rows = shipments.map((shipment) => toRow(shipment, supplierId));
  const costTotal = rows.reduce((sum, row) => sum + (row.cost ?? 0), 0);

  /** @param {SupplierShipmentRow} row */
  const shipmentHref = (row) =>
    `/logistics/contract/${row.contractId}/shipment/${row.id}`;

  /** @type {import('@/shared/components/advance-table.jsx').AdvanceTableColumn<any>[]} */
  const columns = [
    {
      key: 'shipmentCode',
      header: 'Mã shipment',
      width: proportional(1.4),
      renderCell: (row) =>
        row.__isTotalsRow ? (
          <Text weight="bold" xstyle={styles.nowrap}>
            {`Tổng cộng (${rows.length}/${totalCount} shipment hiển thị)`}
          </Text>
        ) : (
          <Link href={shipmentHref(row)} weight="bold">
            {row.shipmentCode}
          </Link>
        ),
    },
    {
      key: 'contractNumber',
      header: 'Hợp đồng',
      width: proportional(1),
      renderCell: (row) =>
        row.__isTotalsRow ? null : (
          <Link href={`/logistics/contract/${row.contractId}`}>
            {row.contractNumber}
          </Link>
        ),
    },
    {
      key: 'roles',
      header: 'Vai trò',
      width: proportional(1.3),
      renderCell: (row) =>
        row.__isTotalsRow ? null : (
          <HStack gap={1} wrap="wrap">
            {row.roles.map((/** @type {string} */ role) => (
              <MetaPill
                key={role}
                label={ROLES[role]?.label ?? role}
                tone={ROLES[role]?.tone ?? 'neutral'}
                size="sm"
              />
            ))}
          </HStack>
        ),
    },
    {
      key: 'etd',
      header: 'ETD',
      width: pixel(128),
      renderCell: (row) =>
        row.__isTotalsRow ? null : formatDisplayDate(row.etd ?? ''),
    },
    {
      key: 'eta',
      header: 'ETA',
      width: pixel(128),
      renderCell: (row) =>
        row.__isTotalsRow ? null : formatDisplayDate(row.eta ?? ''),
    },
    {
      key: 'status',
      header: 'Tình trạng',
      width: proportional(1.3),
      renderCell: (row) =>
        row.__isTotalsRow ? null : (
          <MetaPill
            label={labelForShipmentStatus(row.status)}
            tone={metaToneForShipmentStatus(row.status)}
            size="sm"
            hasDot
          />
        ),
    },
    {
      key: 'cost',
      header: 'Chi phí',
      width: proportional(1),
      align: 'end',
      renderCell: (row) =>
        row.__isTotalsRow ? (
          <Text size="lg" weight="bold" color="accent" hasTabularNumbers>
            {formatVndAmount(costTotal)}
          </Text>
        ) : (
          <MetaCellText
            value={
              row.cost == null ? null : (
                <Text weight="bold" hasTabularNumbers>
                  {formatVndAmount(row.cost)}
                </Text>
              )
            }
          />
        ),
    },
    {
      key: 'actions',
      header: 'Thao tác',
      width: pixel(104),
      align: 'center',
      renderCell: (row) =>
        row.__isTotalsRow ? null : (
          <IconButton
            label={`Xem ${row.shipmentCode}`}
            tooltip="Xem"
            icon={<Icon icon={Eye} size="sm" />}
            variant="ghost"
            size="sm"
            onClick={() => router.push(shipmentHref(row))}
          />
        ),
    },
  ];

  async function handleExport() {
    setIsExporting(true);
    try {
      const conditions = supplierShipmentConditions(supplierId, query.search);
      /** @type {import('../types/index.js').Shipment[]} */
      const all = [];
      for (let next = 1; ; next += 1) {
        const pageResult = await searchAllShipments({
          page: next,
          pageSize: 100,
          conditions,
        });
        if (!pageResult.success) {
          toast({ body: pageResult.message, type: 'error' });
          return;
        }
        all.push(...pageResult.shipments);
        if (next >= pageResult.totalPages) break;
      }
      const XLSX = await import('xlsx');
      const sheet = XLSX.utils.json_to_sheet(
        all.map((shipment) => {
          const row = toRow(shipment, supplierId);
          return {
            'Mã shipment': row.shipmentCode,
            'Hợp đồng': row.contractNumber,
            'Vai trò': row.roles
              .map((role) => ROLES[role]?.label ?? role)
              .join(', '),
            ETD: formatDisplayDate(row.etd ?? ''),
            ETA: formatDisplayDate(row.eta ?? ''),
            'Tình trạng': labelForShipmentStatus(row.status),
            'Chi phí (VNĐ)': row.cost ?? '',
          };
        }),
      );
      const book = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(book, sheet, 'Shipment');
      XLSX.writeFile(
        book,
        `shipment-${supplierName.replace(/[/\\:*?"<>|]/g, '-')}.xlsx`,
      );
    } finally {
      setIsExporting(false);
    }
  }

  const totalsRow = { id: '__totals', __isTotalsRow: true };

  return (
    <MetaShipmentSection
      icon={Ship}
      title="Danh sách Shipment liên quan"
      subtitle="Lô hàng có nhà cung cấp là forwarder, đơn vị dịch vụ hoặc nhà cung cấp chi phí"
      pill={
        result?.success ? { label: `${totalCount} shipment` } : undefined
      }
      actions={
        <HStack gap={3} vAlign="center" wrap="wrap">
          <TextInput
            label="Tìm shipment"
            isLabelHidden
            placeholder="Tìm mã lô, booking…"
            startIcon={Search}
            hasClear
            width={280}
            value={search}
            onChange={(value) => {
              setSearch(value);
              setPage(1);
            }}
          />
          <Button
            label="Xuất Excel"
            variant="secondary"
            icon={
              <Icon
                icon={Download}
                size="sm"
                color={/** @type {any} */ ('meta-green')}
              />
            }
            isLoading={isExporting}
            isDisabled={totalCount === 0}
            onClick={handleExport}
          />
        </HStack>
      }
    >
      {/* The table bleeds into the card padding (edge-to-edge), so the
          footer needs more than the usual gap to clear it. */}
      <VStack gap={10} hAlign="stretch">
        <TanStackDataTable
          data={rows.length > 0 ? [...rows, totalsRow] : []}
          columns={columns}
          idKey="id"
          density="spacious"
          dividers="rows"
          totalsPosition="bottom"
          ariaLabel="Danh sách Shipment liên quan"
          headerCellXstyle={styles.headerCell}
          totalsRowXstyle={styles.totalsRow}
          emptyState={
            <Text color="secondary">
              {query.isLoading
                ? 'Đang tải…'
                : result && !result.success
                  ? result.message
                  : query.search
                    ? 'Không tìm thấy shipment phù hợp.'
                    : 'Nhà cung cấp chưa tham gia shipment nào.'}
            </Text>
          }
        />
        {totalCount > 0 ? (
          <MetaPagination
            page={page}
            pageSize={PAGE_SIZE}
            totalCount={totalCount}
            totalPages={totalPages}
            onPageChange={setPage}
            itemLabel="shipment"
            isDisabled={query.isFetching}
          />
        ) : null}
      </VStack>
    </MetaShipmentSection>
  );
}

const styles = stylex.create({
  headerCell: {
    backgroundColor: 'var(--meta-surface-container-low)',
  },
  totalsRow: {
    backgroundColor: 'var(--meta-surface-container-low)',
  },
  nowrap: {
    whiteSpace: 'nowrap',
  },
});
