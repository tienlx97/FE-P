'use client';

import { Button } from '@astryxdesign/core/Button';
import { DialogHeader } from '@astryxdesign/core/Dialog';
import { Divider } from '@astryxdesign/core/Divider';
import { HStack } from '@astryxdesign/core/HStack';
import { Icon } from '@astryxdesign/core/Icon';
import { Layout, LayoutContent, LayoutFooter } from '@astryxdesign/core/Layout';
import { Link } from '@astryxdesign/core/Link';
import { MetadataList } from '@astryxdesign/core/MetadataList';
import { Spinner } from '@astryxdesign/core/Spinner';
import { pixel, proportional, Table } from '@astryxdesign/core/Table';
import { Heading, Text } from '@astryxdesign/core/Text';
import { colorVars } from '@astryxdesign/core/theme/tokens.stylex';
import { VStack } from '@astryxdesign/core/VStack';
import * as stylex from '@stylexjs/stylex';
import { Building2, Download } from 'lucide-react';
import { useState } from 'react';

import { CommonDialog } from '@/shared/components/common-dialog.jsx';
import { UnderlinedMetadataListItem as MetadataListItem } from '@/shared/components/expandable-row-styles.jsx';
import { formatDisplayDate } from '@/shared/config/date-input-format.js';

import { formatMoney } from '../config/currencies.js';
import { useCustomerContractsQuery } from '../hooks/use-contracts-query.js';
import { useCustomersQuery } from '../hooks/use-customers-query.js';
import { ContractFormDialog } from './contract-form-dialog.jsx';

const styles = stylex.create({
  contractNumberLink: {
    color: colorVars['--color-icon-blue'],
    fontWeight: 'bold',
  },
});

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
 * dialog's fixed 4 columns since it has no column picker of its own.
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
 * "Chi tiết khách hàng" — opened by customer id from anywhere a customer
 * name appears as a link (Contract's Buyer field today). Shows the
 * customer's profile plus a "Hợp đồng đã làm" table (contract
 * number/value/sign date/completion date), independent of
 * `customers-list.jsx`'s own inline row-expansion (that page keeps its
 * existing profile-only panel unchanged; this dialog is the one reachable
 * from outside the Customers list).
 *
 * Looks the customer up from `useCustomersQuery`'s already-cached full
 * directory rather than a dedicated fetch — the backend has no
 * `GET /api/v1/customers/{id}` endpoint (BE-kt-xnk), only list/search.
 * @param {{ customerId: string, onOpenChange: (isOpen: boolean) => void }} props
 */
export function CustomerDetailDialog({ customerId, onOpenChange }) {
  const customersQuery = useCustomersQuery();
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

  const customer = customersQuery.data?.success
    ? customersQuery.data.customers.find((row) => row.id === customerId)
    : undefined;
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
          xstyle={styles.contractNumberLink}
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
      renderCell: (contract) => orDash(
        contract.projectCompletionDate
          ? formatDisplayDate(contract.projectCompletionDate)
          : null,
      ),
    },
  ];

  return (
    <>
      <CommonDialog isOpen onOpenChange={onOpenChange} width={720}>
        <Layout
          header={
            <DialogHeader
              title={customer ? customer.companyName : 'Chi tiết khách hàng'}
              onOpenChange={onOpenChange}
            />
          }
          content={
            <LayoutContent padding={4}>
              {!customer ? (
                <HStack hAlign="center" paddingBlock={6}>
                  <Spinner label="Đang tải thông tin khách hàng" />
                </HStack>
              ) : (
                <VStack gap={4} hAlign="stretch">
                  <HStack gap={3} vAlign="center">
                    <Icon icon={Building2} size="md" />
                    <VStack gap={1}>
                      <Heading level={3}>{customer.companyName}</Heading>
                      {customer.representativeName ? (
                        <Text color="secondary">
                          {customer.representativeName}
                          {customer.representativeTitle
                            ? ` · ${customer.representativeTitle}`
                            : ''}
                        </Text>
                      ) : null}
                    </VStack>
                  </HStack>

                  <MetadataList columns={2} label={{ position: 'top' }}>
                    <MetadataListItem label="Địa chỉ">
                      {orDash(customer.address)}
                    </MetadataListItem>
                    <MetadataListItem label="Mã khách hàng">
                      {orDash(customer.profile?.code)}
                    </MetadataListItem>
                  </MetadataList>

                  <Divider />

                  <HStack hAlign="between" vAlign="center">
                    <Text weight="semibold">Hợp đồng đã làm</Text>
                    <Button
                      label="Xuất file"
                      variant="secondary"
                      size="sm"
                      icon={<Icon icon={Download} size="sm" />}
                      isDisabled={contractsQuery.isLoading || contracts.length === 0}
                      onClick={() =>
                        exportContractHistoryCsv(customer.companyName, contracts)
                      }
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
                        <Text color="secondary">
                          Khách hàng này chưa có hợp đồng nào.
                        </Text>
                      }
                    />
                  )}
                </VStack>
              )}
            </LayoutContent>
          }
          footer={
            <LayoutFooter>
              <HStack hAlign="end" gap={2}>
                <Button
                  width={144}
                  label="Đóng"
                  variant="secondary"
                  onClick={() => onOpenChange(false)}
                />
              </HStack>
            </LayoutFooter>
          }
        />
      </CommonDialog>

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
