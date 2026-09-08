'use client';

import { Button } from '@astryxdesign/core/Button';
import { HStack } from '@astryxdesign/core/HStack';
import { Icon } from '@astryxdesign/core/Icon';
import { IconButton } from '@astryxdesign/core/IconButton';
import { List, ListItem } from '@astryxdesign/core/List';
import { MetadataList } from '@astryxdesign/core/MetadataList';
import { Text } from '@astryxdesign/core/Text';
import { VStack } from '@astryxdesign/core/VStack';
import { Pencil, Plus } from 'lucide-react';

import { UnderlinedMetadataListItem as MetadataListItem } from '@/shared/components/expandable-row-styles.jsx';
import { formatDisplayDate } from '@/shared/config/date-input-format.js';

import { labelForCommissionAnnexType } from '../config/commission-annex-types.js';
import { formatMoney } from '../config/currencies.js';

/** @typedef {'info' | 'paymentSchedule' | 'shipment' | 'commission'} ExpandedTab */

/** @param {string | null | undefined} value */
function orDash(value) {
  return value == null || value === '' ? '—' : value;
}

/**
 * Signed amount label for one Commission annex row — same
 * convention as `contractAnnexAmountLabel`/`commissions-list.jsx`'s
 * `annexAmountLabel`: `InfoChange` never represents a value change, so it
 * gets no sign.
 * @param {import('../types/index.js').CommissionAnnex} annex
 * @param {string} currency
 */
function commissionAnnexAmountLabel(annex, currency) {
  const formatted = formatMoney(annex.amount, currency);
  if (annex.type === 'AmountIncrease') return `+ ${formatted}`;
  if (annex.type === 'AmountDecrease') return `− ${formatted}`;
  return formatted;
}
/** @param {{
 * contract: import('../types/index.js').Contract,
 * customersById: Map<string, import('../types/index.js').Customer>,
 * onAddCommissionAnnex: () => void,
 * onEditCommissionAnnex: (annex: import('../types/index.js').CommissionAnnex) => void,
 * onAddCommissionPayment: (commission: import('../types/index.js').Commission) => void,
 * commission: import('../types/index.js').Commission,
 * commissionAnnexes: import('../types/index.js').CommissionAnnex[],
 * commissionGrandTotal: number,
 * }} props */
export function ContractCommissionTab({
  contract,
  customersById,
  onAddCommissionAnnex,
  onEditCommissionAnnex,
  onAddCommissionPayment,
  commission,
  commissionAnnexes,
  commissionGrandTotal,
}) {
  return (
    <VStack gap={4} hAlign="stretch">
      {/* Same field set/layout as `commissions-list.jsx`'s Commission
              view (`CommissionFields` in read-only mode) — this tab shows
              the same content, just entered from a contract's row instead
              of the system-wide Commission list. */}
      <MetadataList columns={4} label={{ position: 'top' }}>
        <MetadataListItem label="Mã">{commission.code}</MetadataListItem>
        <MetadataListItem label="Số hợp đồng">
          {contract.contractNumber}
        </MetadataListItem>
        <MetadataListItem label="Dự án">
          {contract.projectName}
        </MetadataListItem>
        <MetadataListItem label="Giá trị">
          {formatMoney(commission.value, contract.currency)}
        </MetadataListItem>
        <MetadataListItem label="Trung gian">
          {orDash(customersById.get(commission.partyCustomerId)?.companyName)}
        </MetadataListItem>
        <MetadataListItem label="Ngày ký">
          {formatDisplayDate(commission.signedDate)}
        </MetadataListItem>
        <MetadataListItem label="Bên nhận hoa hồng">
          {commission.partySigned ? 'Đã ký' : 'Chưa ký'}
        </MetadataListItem>
        <MetadataListItem label="Bên bán">
          {commission.sellerSigned ? 'Đã ký' : 'Chưa ký'}
        </MetadataListItem>
      </MetadataList>

      <MetadataList
        title="Đợt thanh toán"
        columns={4}
        label={{ position: 'top' }}
      >
        {commission.paymentTerms.length === 0 ? (
          <MetadataListItem label="Đợt thanh toán">—</MetadataListItem>
        ) : (
          commission.paymentTerms.map((term, index) => (
            <MetadataListItem key={term.id} label={`Đợt ${index + 1}`}>
              {term.paymentRatioPercent}% · {orDash(term.paymentCondition)}
            </MetadataListItem>
          ))
        )}
      </MetadataList>

      <HStack hAlign="between" vAlign="center">
        <Text weight="semibold">Lịch sử thanh toán</Text>
        <Button
          label="Thêm nhanh"
          variant="secondary"
          size="sm"
          icon={<Icon icon={Plus} />}
          onClick={() => onAddCommissionPayment(commission)}
        />
      </HStack>

      <MetadataList columns={4} label={{ position: 'top' }}>
        {commission.paymentHistory.length === 0 ? (
          <MetadataListItem label="Lịch sử thanh toán">—</MetadataListItem>
        ) : (
          commission.paymentHistory.map((payment) => (
            <MetadataListItem key={payment.id} label={payment.paymentDate}>
              {formatMoney(payment.amount, contract.currency)}
              {payment.note ? ` · ${payment.note}` : ''}
            </MetadataListItem>
          ))
        )}
      </MetadataList>

      <HStack hAlign="between" vAlign="center">
        <Text weight="semibold">Phụ lục</Text>
        <Button
          label="Thêm phụ lục"
          variant="secondary"
          size="sm"
          icon={<Icon icon={Plus} />}
          onClick={onAddCommissionAnnex}
        />
      </HStack>

      {commissionAnnexes.length === 0 ? (
        <Text color="secondary">Chưa có phụ lục</Text>
      ) : (
        <List hasDividers density="compact">
          {commissionAnnexes.map((annex) => (
            <ListItem
              key={annex.id}
              label={`${annex.annexCode} · ${labelForCommissionAnnexType(annex.type)}`}
              description={[
                `Ký ${annex.signedDate}`,
                `Bên bán: ${annex.sellerSigned ? 'đã ký' : 'chưa ký'}`,
                `Bên nhận hoa hồng: ${annex.partySigned ? 'đã ký' : 'chưa ký'}`,
              ].join(' · ')}
              endContent={
                <HStack gap={1} vAlign="center">
                  <Text weight="semibold">
                    {commissionAnnexAmountLabel(annex, contract.currency)}
                  </Text>
                  <IconButton
                    label={`Sửa ${annex.annexCode}`}
                    tooltip="Sửa phụ lục"
                    icon={<Icon icon={Pencil} size="sm" />}
                    variant="ghost"
                    size="sm"
                    onClick={() => onEditCommissionAnnex(annex)}
                  />
                </HStack>
              }
            />
          ))}
        </List>
      )}

      <HStack hAlign="between" vAlign="center">
        <Text weight="semibold">Tổng cộng:</Text>
        <Text weight="semibold">
          {formatMoney(commissionGrandTotal, contract.currency)}
        </Text>
      </HStack>
    </VStack>
  );
}
