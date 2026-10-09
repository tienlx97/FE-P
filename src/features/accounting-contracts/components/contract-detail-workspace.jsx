'use client';

import { Banner } from '@astryxdesign/core/Banner';
import { BreadcrumbItem, Breadcrumbs } from '@astryxdesign/core/Breadcrumbs';
import { Button } from '@astryxdesign/core/Button';
import { Card } from '@astryxdesign/core/Card';
import { Heading } from '@astryxdesign/core/Heading';
import { HStack } from '@astryxdesign/core/HStack';
import { Icon } from '@astryxdesign/core/Icon';
import {
  MetadataList,
  MetadataListItem,
} from '@astryxdesign/core/MetadataList';
import { Skeleton } from '@astryxdesign/core/Skeleton';
import { Tab, TabList } from '@astryxdesign/core/TabList';
import { Text } from '@astryxdesign/core/Text';
import { Token } from '@astryxdesign/core/Token';
import { VStack } from '@astryxdesign/core/VStack';
import { Pencil, Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { MetaThemeProvider } from '@/shared/components/custom/meta/theme-provider.jsx';
import { PageContentShell } from '@/shared/components/page-content-shell.jsx';
import { formatDisplayDate } from '@/shared/config/date-input-format.js';

import { formatVnd } from '../config/money.js';
import {
  useContractQuery,
  useDeleteContractMutation,
} from '../hooks/use-contracts.js';
import { AppendicesPanel } from './appendices-panel.jsx';
import { ConfirmDeleteDialog } from './confirm-delete-dialog.jsx';
import { ContractFormDialog } from './contract-form-dialog.jsx';
import { InstallmentsPanel } from './installments-panel.jsx';
import { InvoicesPanel } from './invoices-panel.jsx';

/** @param {string | null | undefined} iso */
function dateOrDash(iso) {
  return iso ? formatDisplayDate(iso) : '—';
}

/**
 * Accounting contract page: header facts, every derived value, then the
 * Phụ lục / Hoá đơn / Đợt thanh toán tabs.
 * @param {{ contractId: string }} props
 */
export function AccountingContractDetailWorkspace({ contractId }) {
  const router = useRouter();
  const [tab, setTab] = useState('installments');
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const contractQuery = useContractQuery(contractId);
  const deleteMutation = useDeleteContractMutation();

  const result = contractQuery.data;
  const detail = result?.success ? result.data : null;
  const contract = detail?.contract ?? null;

  return (
    <PageContentShell isFullWidth>
      <MetaThemeProvider>
        <VStack gap={4} hAlign="stretch">
          <Breadcrumbs>
            <BreadcrumbItem href="/accounting">Kế toán</BreadcrumbItem>
            <BreadcrumbItem href="/accounting/contracts">
              Hợp đồng
            </BreadcrumbItem>
            <BreadcrumbItem isCurrent>
              {contract?.contractNumber ?? '…'}
            </BreadcrumbItem>
          </Breadcrumbs>

          {result && !result.success ? (
            <Banner status="error" title={result.message} />
          ) : null}
          {contractQuery.isLoading ? <Skeleton height={240} /> : null}

          {detail && contract ? (
            <>
              <HStack hAlign="between" vAlign="center" gap={3}>
                <VStack gap={1}>
                  <Heading level={2}>
                    Hợp đồng {contract.contractNumber}
                  </Heading>
                  <Text color="secondary">
                    {contract.projectCode} · {contract.projectName}
                  </Text>
                </VStack>
                <HStack gap={2}>
                  <Button
                    label="Sửa"
                    icon={<Icon icon={Pencil} size="sm" />}
                    variant="secondary"
                    onClick={() => setIsEditOpen(true)}
                  />
                  <Button
                    label="Xoá"
                    icon={<Icon icon={Trash2} size="sm" />}
                    variant="secondary"
                    onClick={() => setIsDeleting(true)}
                  />
                </HStack>
              </HStack>

              <Card>
                <VStack gap={4} hAlign="stretch">
                  <MetadataList columns={4} label={{ position: 'top' }}>
                    <MetadataListItem label="Khách hàng">
                      {contract.customerName ?? '—'}
                    </MetadataListItem>
                    <MetadataListItem label="Nguồn">
                      {contract.sourceName ?? '—'}
                    </MetadataListItem>
                    <MetadataListItem label="Ngày ký">
                      {dateOrDash(contract.signedDate)}
                    </MetadataListItem>
                    <MetadataListItem label="Ngày tới hạn thanh toán">
                      {dateOrDash(contract.paymentDueDate)}
                    </MetadataListItem>
                    <MetadataListItem label="Giá trị hợp đồng (trước thuế)">
                      {formatVnd(contract.valueBeforeTax)}
                    </MetadataListItem>
                    <MetadataListItem label="Thuế">
                      {contract.taxRatePercent}%
                    </MetadataListItem>
                    <MetadataListItem label="Giá trị hợp đồng (sau thuế)">
                      {formatVnd(contract.valueAfterTax)}
                    </MetadataListItem>
                    <MetadataListItem label="Giá trị quyết toán">
                      <Text weight="semibold">
                        {formatVnd(contract.settlementValue)}
                      </Text>
                    </MetadataListItem>
                    <MetadataListItem label="Đã xuất hoá đơn">
                      {formatVnd(contract.invoicedValue)}
                    </MetadataListItem>
                    <MetadataListItem label="Còn phải xuất hoá đơn">
                      {formatVnd(contract.remainingToInvoice)}
                    </MetadataListItem>
                    <MetadataListItem label="Đã thanh toán">
                      {formatVnd(contract.paidValue)}
                    </MetadataListItem>
                    <MetadataListItem label="Chưa thanh toán">
                      <Text weight="semibold">
                        {formatVnd(contract.unpaidValue)}
                      </Text>
                    </MetadataListItem>
                    <MetadataListItem label="Số ngày quá hạn">
                      {contract.overdueDays ? (
                        <Token
                          size="sm"
                          color="red"
                          label={`${contract.overdueDays} ngày`}
                        />
                      ) : (
                        '—'
                      )}
                    </MetadataListItem>
                    <MetadataListItem label="Ghi chú">
                      {contract.note ?? '—'}
                    </MetadataListItem>
                  </MetadataList>
                </VStack>
              </Card>

              <TabList value={tab} onChange={setTab} hasDivider>
                <Tab
                  value="installments"
                  label="Đợt thanh toán"
                  endContent={String(detail.installments.length)}
                />
                <Tab
                  value="invoices"
                  label="Hoá đơn"
                  endContent={String(detail.invoices.length)}
                />
                <Tab
                  value="appendices"
                  label="Phụ lục"
                  endContent={String(detail.appendices.length)}
                />
              </TabList>

              {tab === 'installments' ? (
                <InstallmentsPanel detail={detail} />
              ) : null}
              {tab === 'invoices' ? <InvoicesPanel detail={detail} /> : null}
              {tab === 'appendices' ? (
                <AppendicesPanel detail={detail} />
              ) : null}

              <ContractFormDialog
                isOpen={isEditOpen}
                onOpenChange={setIsEditOpen}
                contract={contract}
              />
              <ConfirmDeleteDialog
                title={
                  isDeleting
                    ? `Xoá hợp đồng ${contract.contractNumber} cùng phụ lục, hoá đơn và đợt thanh toán?`
                    : null
                }
                onClose={() => setIsDeleting(false)}
                onConfirm={async () => {
                  const deleted = await deleteMutation.mutateAsync(contract.id);
                  if (deleted.success) router.push('/accounting/contracts');
                  return deleted;
                }}
              />
            </>
          ) : null}
        </VStack>
      </MetaThemeProvider>
    </PageContentShell>
  );
}
