'use client';

import { Button } from '@astryxdesign/core/Button';
import { Grid } from '@astryxdesign/core/Grid';
import {
  MetadataList,
  MetadataListItem,
} from '@astryxdesign/core/MetadataList';
import { Text } from '@astryxdesign/core/Text';
import { VStack } from '@astryxdesign/core/VStack';
import { Building2, FileText, Paperclip, ReceiptText } from 'lucide-react';

import {
  MetaOverviewSummaryCard,
  MetaPill,
  MetaTableCard,
} from '@/shared/components/custom/meta/index.js';
import { formatDisplayDate } from '@/shared/config/date-input-format.js';

import { contractFormValues } from '../config/edit-values.js';
import { formatVnd, valueAfterTax } from '../config/money.js';
import { paymentOverview } from '../config/payment-overview.js';
import { useCustomersQuery } from '../hooks/use-catalogs.js';
import { useSaveContractMutation } from '../hooks/use-contracts.js';
import { QuickEditValue } from './quick-edit-value.jsx';

/**
 * Logistics overview summary and payment strip, adapted to accounting:
 * customer, project/value facts, invoices and signed appendices.
 * @param {{
 * detail: import('../types/index.js').AccountingContractDetail,
 * metrics: ReturnType<typeof import('../config/contract-view.js').contractMetrics>,
 * onOpenTab: (tab: 'overview' | 'installments' | 'invoices' | 'appendices') => void,
 * }} props
 */
export function ContractOverviewPanel({ detail, metrics, onOpenTab }) {
  const c = detail.contract;
  const saveContract = useSaveContractMutation();
  const payments = paymentOverview(detail);
  const customersQuery = useCustomersQuery();
  const customer = customersQuery.data?.success
    ? customersQuery.data.data.find((item) => item.id === c.customerId)
    : null;
  return (
    <VStack gap={5} hAlign="stretch">
      <MetaOverviewSummaryCard
        metrics={[
          metrics.settlement,
          metrics.paid,
          metrics.unpaid,
          metrics.invoiced,
        ]}
        paidPercent={payments.paidPercent}
        currentPercent={payments.currentPercent}
        paidPercentLabel={`${Math.round(payments.paidPercent)}% thực tế thanh toán`}
        paidAmountValue={`${formatVnd(c.paidValue)} VND`}
        totalAmountValue={`${formatVnd(c.settlementValue)} VND`}
        installments={payments.installments}
        installmentsLabel="Các đợt thanh toán"
        installmentTermLabel="Thanh toán"
        onViewDetail={() => onOpenTab('installments')}
      />
      <Grid columns={{ minWidth: 280, max: 3 }} gap={5}>
        <VStack gap={4} hAlign="stretch">
          <Text weight="bold" color="secondary">
            1. KHÁCH HÀNG
          </Text>
          <MetaTableCard icon={Building2} title="Khách hàng" isBodyPadded>
            <VStack gap={4} hAlign="stretch">
              <Text weight="bold" color="accent">
                {c.customerName ?? '—'}
              </Text>
              <MetadataList columns={1}>
                <MetadataListItem label="Mã số thuế">
                  {customer?.taxCode ?? '—'}
                </MetadataListItem>
                <MetadataListItem label="Địa chỉ">
                  {customer?.address ?? '—'}
                </MetadataListItem>
                <MetadataListItem label="Người liên hệ">
                  {customer?.contactPerson ?? '—'}
                </MetadataListItem>
                <MetadataListItem label="Điện thoại">
                  {customer?.phone ?? '—'}
                </MetadataListItem>
                <MetadataListItem label="Email">
                  {customer?.email ?? '—'}
                </MetadataListItem>
              </MetadataList>
              {customersQuery.data && !customersQuery.data.success ? (
                <Text color="secondary">{customersQuery.data.message}</Text>
              ) : null}
            </VStack>
          </MetaTableCard>
        </VStack>
        <VStack gap={4} hAlign="stretch">
          <Text weight="bold" color="secondary">
            2. CÔNG TRÌNH & GIÁ TRỊ
          </Text>
          <MetaTableCard
            icon={FileText}
            title="Thông tin hợp đồng"
            isBodyPadded
          >
            <MetadataList columns={1}>
              <MetadataListItem label="Số hợp đồng">
                {c.contractNumber}
              </MetadataListItem>
              <MetadataListItem label="Mã công trình">
                <Text weight="bold" color="accent">
                  {c.projectCode}
                </Text>
              </MetadataListItem>
              <MetadataListItem label="Tên công trình">
                {c.projectName}
              </MetadataListItem>
              <MetadataListItem label="Ngày ký">
                {formatDisplayDate(c.signedDate)}
              </MetadataListItem>
              <MetadataListItem label="Nguồn">
                {c.sourceName ?? '—'}
              </MetadataListItem>
              <MetadataListItem label="Trước thuế">
                <Text hasTabularNumbers>{formatVnd(c.valueBeforeTax)} VND</Text>
              </MetadataListItem>
              <MetadataListItem label="Thuế">
                {c.taxRatePercent}%
              </MetadataListItem>
              <MetadataListItem label="Sau thuế">
                <QuickEditValue
                  label="Giá trị hợp đồng (sau thuế)"
                  value={c.valueAfterTax}
                  computed={valueAfterTax(c.valueBeforeTax, c.taxRatePercent)}
                  isTyped={c.isValueAfterTaxManual}
                  text={`${formatVnd(c.valueAfterTax)} VND`}
                  isBold
                  onSave={(typed) =>
                    saveContract.mutateAsync({
                      id: c.id,
                      version: c.version,
                      values: {
                        ...contractFormValues(c, c.companyId),
                        valueAfterTax: typed,
                      },
                    })
                  }
                />
              </MetadataListItem>
              <MetadataListItem label="Ghi chú">
                {c.note ?? '—'}
              </MetadataListItem>
            </MetadataList>
          </MetaTableCard>
        </VStack>
        <VStack gap={4} hAlign="stretch">
          <Text weight="bold" color="secondary">
            3. CÔNG NỢ & CHỨNG TỪ
          </Text>
          <MetaTableCard
            icon={ReceiptText}
            title="Thanh toán & hoá đơn"
            isBodyPadded
            actions={
              <Button
                label="Xem hoá đơn"
                size="sm"
                variant="ghost"
                onClick={() => onOpenTab('invoices')}
              />
            }
          >
            <MetadataList columns={1}>
              <MetadataListItem label="Hạn thanh toán">
                {c.paymentDueDate ? formatDisplayDate(c.paymentDueDate) : '—'}
              </MetadataListItem>
              <MetadataListItem label="Quá hạn">
                {c.overdueDays ? (
                  <MetaPill label={`${c.overdueDays} ngày`} tone="danger" />
                ) : (
                  '—'
                )}
              </MetadataListItem>
              <MetadataListItem label="Thực tế thanh toán">
                <Text
                  color={/** @type {any} */ ('meta-success')}
                  weight="bold"
                  hasTabularNumbers
                >
                  {formatVnd(c.paidValue)} VND
                </Text>
              </MetadataListItem>
              <MetadataListItem label="Chưa thanh toán">
                <Text
                  color={/** @type {any} */ ('meta-danger')}
                  weight="bold"
                  hasTabularNumbers
                >
                  {formatVnd(c.unpaidValue)} VND
                </Text>
              </MetadataListItem>
              <MetadataListItem label="Hoá đơn đã xuất">
                {detail.invoices.length} hoá đơn
              </MetadataListItem>
              <MetadataListItem label="Đợt thanh toán">
                {detail.installments.length} đợt ·{' '}
                {detail.installments.reduce(
                  (sum, stage) => sum + stage.subInstallments.length,
                  0,
                )}{' '}
                lần
              </MetadataListItem>
            </MetadataList>
          </MetaTableCard>
          <MetaTableCard
            icon={Paperclip}
            title="Phụ lục hợp đồng"
            isBodyPadded
            actions={
              <Button
                label="Xem phụ lục"
                size="sm"
                variant="ghost"
                onClick={() => onOpenTab('appendices')}
              />
            }
          >
            <MetadataList columns={1}>
              <MetadataListItem label="Số lượng">
                {detail.appendices.length} phụ lục
              </MetadataListItem>
              <MetadataListItem label="Đã ký đủ">
                {
                  detail.appendices.filter(
                    (a) => a.buyerSigned && a.sellerSigned,
                  ).length
                }{' '}
                phụ lục
              </MetadataListItem>
              <MetadataListItem label="Phát sinh tăng">
                {metrics.increase.value} VND
              </MetadataListItem>
              <MetadataListItem label="Phát sinh giảm">
                {metrics.decrease.value} VND
              </MetadataListItem>
            </MetadataList>
          </MetaTableCard>
        </VStack>
      </Grid>
    </VStack>
  );
}
