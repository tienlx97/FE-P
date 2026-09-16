'use client';

import { Button } from '@astryxdesign/core/Button';
import { HStack } from '@astryxdesign/core/HStack';
import { Icon } from '@astryxdesign/core/Icon';
import { Link } from '@astryxdesign/core/Link';
import { Spinner } from '@astryxdesign/core/Spinner';
import { pixel, proportional, Table } from '@astryxdesign/core/Table';
import { Text } from '@astryxdesign/core/Text';
import { VStack } from '@astryxdesign/core/VStack';
import { Download } from 'lucide-react';
import { useState } from 'react';

import { recordLinkStyles } from '@/shared/components/record-link-style.js';
import { formatDisplayDate } from '@/shared/config/date-input-format.js';

import { formatMoney } from '../config/currencies.js';
import { useCustomerContractsQuery } from '../hooks/use-contracts-query.js';
import { ContractFormDialog } from './contract-form-dialog.jsx';

/** @param {string | null | undefined} value */
function orDash(value) {
  return value == null || value === '' ? '—' : value;
}

const CSV_BOM = String.fromCharCode(0xfeff);

/** @param {string} value */
function escapeCsvCell(value) {
  const needsQuoting = /[",\n\r]/.test(value);
  const escaped = value.replace(/"/g, '""');
  return needsQuoting ? `"${escaped}"` : escaped;
}

/**
 * "Xuất file" for the contract-history table — same CSV-with-BOM approach
 * as `AdvanceTable`'s own export (see its doc comment), sized down to this
 * table's fixed 4 columns since it has no column picker of its own.
 * @param {string} customerName
 * @param {import('../types/index.js').Contract[]} contracts
 */
function exportContractHistoryCsv(customerName, contracts) {
  const headerRow = ['Số hợp đồng', 'Giá trị', 'Ngày ký', 'Ngày hoàn thành'];
  const dataRows = contracts.map((contract) => [
    contract.contractNumber,
    formatMoney(contract.contractValue, contract.currency),
    formatDisplayDate(contract.createdDate),
    contract.projectCompletionDate
      ? formatDisplayDate(contract.projectCompletionDate)
      : '—',
  ]);
  const csv = [headerRow, ...dataRows]
    .map((cells) => cells.map((value) => escapeCsvCell(String(value))).join(','))
    .join('\r\n');
  const blob = new Blob([CSV_BOM + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `hop-dong-${customerName}-${new Date().toISOString().slice(0, 10)}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

/**
 * "Hợp đồng đã làm" — a customer's contract history (number/value/sign
 * date/completion date) + CSV export, shared by `CustomerDetailDialog`
 * (opened from a Contract's Buyer link) and `customers-list.jsx`'s own
 * inline row-expansion panel, so both surfaces show the exact same data
 * and can never drift apart. Owns its own `ContractFormDialog` instance —
 * same "one dialog, multiple entrypoints" convention used elsewhere in
 * this feature (`shipments-list.jsx`/`commissions-list.jsx`'s own
 * contract-number links).
 * @param {{ customerId: string, customerName: string }} props
 */
export function CustomerContractHistory({ customerId, customerName }) {
  const contractsQuery = useCustomerContractsQuery(customerId);
  const [contractDialog, setContractDialog] = useState(
    /** @type {{ contract: import('../types/index.js').Contract, sessionKey: string } | null} */ (
      null
    ),
  );
  const [contractDialogTab, setContractDialogTab] = useState(
    /** @type {'profile' | 'annexes' | 'payments' | 'related' | 'fullView'} */ (
      'profile'
    ),
  );

  const contracts = contractsQuery.data?.success
    ? contractsQuery.data.contracts
    : [];

  /** @type {import('@astryxdesign/core/Table').TableColumn<import('../types/index.js').Contract & Record<string, unknown>>[]} */
  const columns = [
    {
      key: 'contractNumber',
      header: 'Số hợp đồng',
      width: pixel(160),
      renderCell: (contract) => (
        <Link
          xstyle={recordLinkStyles.link}
          onClick={() => {
            setContractDialogTab('profile');
            setContractDialog({ contract, sessionKey: contract.id });
          }}
        >
          {contract.contractNumber}
        </Link>
      ),
    },
    {
      key: 'contractValue',
      header: 'Giá trị',
      width: pixel(160),
      align: 'end',
      renderCell: (contract) =>
        formatMoney(contract.contractValue, contract.currency),
    },
    {
      key: 'createdDate',
      header: 'Ngày ký',
      width: pixel(140),
      renderCell: (contract) => formatDisplayDate(contract.createdDate),
    },
    {
      key: 'projectCompletionDate',
      header: 'Ngày hoàn thành',
      width: proportional(1, { minWidth: 140 }),
      renderCell: (contract) =>
        orDash(
          contract.projectCompletionDate
            ? formatDisplayDate(contract.projectCompletionDate)
            : null,
        ),
    },
  ];

  return (
    <>
      <VStack gap={3} hAlign="stretch">
        <HStack hAlign="between" vAlign="center">
          <Text weight="semibold">Hợp đồng đã làm</Text>
          <Button
            label="Xuất file"
            variant="secondary"
            size="sm"
            icon={<Icon icon={Download} size="sm" />}
            isDisabled={contractsQuery.isLoading || contracts.length === 0}
            onClick={() => exportContractHistoryCsv(customerName, contracts)}
          />
        </HStack>

        {contractsQuery.isLoading ? (
          <HStack hAlign="center" paddingBlock={4}>
            <Spinner label="Đang tải danh sách hợp đồng" />
          </HStack>
        ) : (
          <Table
            data={contracts}
            columns={columns}
            idKey="id"
            density="compact"
            dividers="rows"
            emptyState={
              <Text color="secondary">Khách hàng này chưa có hợp đồng nào.</Text>
            }
          />
        )}
      </VStack>

      {contractDialog ? (
        <ContractFormDialog
          key={contractDialog.sessionKey}
          isOpen
          onOpenChange={(open) => {
            if (!open) setContractDialog(null);
          }}
          contract={contractDialog.contract}
          initialMode="view"
          activeTab={contractDialogTab}
          onActiveTabChange={setContractDialogTab}
          onSuccess={(saved) =>
            setContractDialog((current) =>
              current ? { ...current, contract: saved } : current,
            )
          }
        />
      ) : null}
    </>
  );
}
