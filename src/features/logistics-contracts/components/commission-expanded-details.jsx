'use client';

import { Button } from '@astryxdesign/core/Button';
import { Divider } from '@astryxdesign/core/Divider';
import { useMediaQuery } from '@astryxdesign/core/hooks';
import { HStack } from '@astryxdesign/core/HStack';
import { Icon } from '@astryxdesign/core/Icon';
import { IconButton } from '@astryxdesign/core/IconButton';
import { List, ListItem } from '@astryxdesign/core/List';
import { MetadataList } from '@astryxdesign/core/MetadataList';
import { Text } from '@astryxdesign/core/Text';
import { VStack } from '@astryxdesign/core/VStack';
import { Pencil, Plus } from 'lucide-react';

import { UnderlinedMetadataListItem as MetadataListItem } from '@/shared/components/expandable-row-styles.jsx';

import { labelForCommissionAnnexType } from '../config/commission-annex-types.js';
import { formatMoney } from '../config/currencies.js';
import { useCommissionAnnexesQuery } from '../hooks/use-commission-annexes-query.js';

/**
 * A `Commission` plus the fields resolved client-side for display —
 * see the comment above `contractsById` in `CommissionsList` for why
 * these aren't already on the API response.
 * @typedef {import('../types/index.js').Commission & {
 *   contractNumber: string,
 *   projectName: string,
 *   currency: string,
 *   partyCustomerName: string,
 * }} CommissionListRow
 */

/** @param {string | null | undefined} value */
function orDash(value) {
  return value == null || value === '' ? '—' : value;
}

/**
 * Signed amount label for one annex row — same sign convention as
 * `grandTotal`'s `AmountIncrease`/`AmountDecrease` math below:
 * `InfoChange` never represents a value change, so it gets no sign.
 * @param {import('../types/index.js').CommissionAnnex} annex
 * @param {string} currency
 */
function annexAmountLabel(annex, currency) {
  const formatted = formatMoney(annex.amount, currency);
  if (annex.type === 'AmountIncrease') return `+ ${formatted}`;
  if (annex.type === 'AmountDecrease') return `− ${formatted}`;
  return formatted;
}

/**
 * Read-only Commission details and related actions inside its workspace.
 * Child editors are owned outside the table DOM (ADR-0004).
 * @param {{
 *   row: CommissionListRow,
 *   onEdit?: () => void,
 *   onAddAnnex: () => void,
 *   onEditAnnex: (annex: import('../types/index.js').CommissionAnnex) => void,
 *   onAddPayment: () => void,
 * }} props
 */
export function CommissionExpandedDetails({
  row,
  onEdit,
  onAddAnnex,
  onEditAnnex,
  onAddPayment,
}) {
  const isNarrow = useMediaQuery('(max-width: 640px)');
  const annexesQuery = useCommissionAnnexesQuery(row.contractId);
  const annexes = annexesQuery.data?.success ? annexesQuery.data.annexes : [];

  // "Tổng cộng" = the commission's own `value` plus every annex's `amount`,
  // signed by its `type` — `AmountIncrease` adds, `AmountDecrease`
  // subtracts, `InfoChange` doesn't touch the value (matches
  // `docs/api/Commissions.md`'s note that annexes never mutate the
  // commission's own `Value`, so this total is a display-only rollup, not
  // something the backend also computes).
  const annexesTotal = annexes.reduce((total, annex) => {
    if (annex.type === 'AmountIncrease') return total + annex.amount;
    if (annex.type === 'AmountDecrease') return total - annex.amount;
    return total;
  }, 0);
  const grandTotal = row.value + annexesTotal;

  return (
    <VStack gap={4} hAlign="stretch">
      {/* Rows 1–2: one columns={isNarrow ? 2 : 4} grid — each row already has exactly 4
          items, so they line up naturally without needing padding cells
          (unlike the previous 2-item/3-item split). Same grid width as
          "Đợt thanh toán" below, so columns line up across all 3 rows. */}
      <MetadataList columns={isNarrow ? 2 : 4} label={{ position: 'top' }}>
        <MetadataListItem label="Mã">{row.code}</MetadataListItem>
        <MetadataListItem label="Số hợp đồng">
          {orDash(row.contractNumber)}
        </MetadataListItem>
        <MetadataListItem label="Dự án">
          {orDash(row.projectName)}
        </MetadataListItem>
        <MetadataListItem label="Giá trị">
          {formatMoney(row.value, row.currency)}
        </MetadataListItem>
        <MetadataListItem label="Trung gian">
          {orDash(row.partyCustomerName)}
        </MetadataListItem>
        <MetadataListItem label="Ngày ký">
          {orDash(row.signedDate)}
        </MetadataListItem>
        <MetadataListItem label="Bên nhận hoa hồng">
          {row.partySigned ? 'Đã ký' : 'Chưa ký'}
        </MetadataListItem>
        <MetadataListItem label="Bên bán">
          {row.sellerSigned ? 'Đã ký' : 'Chưa ký'}
        </MetadataListItem>
      </MetadataList>

      {/* Row 3: Đợt thanh toán */}
      <MetadataList
        title="Đợt thanh toán"
        columns={isNarrow ? 2 : 4}
        label={{ position: 'top' }}
        style={{ fontWeight: 'bold' }}
      >
        {row.paymentTerms.length === 0 ? (
          <MetadataListItem label="Đợt thanh toán">—</MetadataListItem>
        ) : (
          row.paymentTerms.map((term, index) => (
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
          onClick={onAddPayment}
        />
      </HStack>

      <MetadataList columns={isNarrow ? 2 : 4} label={{ position: 'top' }}>
        {row.paymentHistory.length === 0 ? (
          <MetadataListItem label="Lịch sử thanh toán">—</MetadataListItem>
        ) : (
          row.paymentHistory.map((payment) => (
            <MetadataListItem key={payment.id} label={payment.paymentDate}>
              {formatMoney(payment.amount, row.currency)}
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
          onClick={onAddAnnex}
        />
      </HStack>

      {annexes.length === 0 ? (
        <Text color="secondary">Chưa có phụ lục</Text>
      ) : (
        <List hasDividers density="compact">
          {annexes.map((annex) => (
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
                    {annexAmountLabel(annex, row.currency)}
                  </Text>
                  <IconButton
                    label={`Sửa ${annex.annexCode}`}
                    tooltip="Sửa phụ lục"
                    icon={<Icon icon={Pencil} size="sm" />}
                    variant="ghost"
                    size="sm"
                    onClick={() => onEditAnnex(annex)}
                  />
                </HStack>
              }
            />
          ))}
        </List>
      )}

      <HStack hAlign="between" vAlign="center">
        <Text weight="semibold">Tổng cộng:</Text>
        <Text weight="semibold">{formatMoney(grandTotal, row.currency)}</Text>
      </HStack>

      {onEdit ? (
        <>
          <Divider />

          <HStack hAlign="end">
            <Button
              label="Sửa Commission"
              variant="secondary"
              size="sm"
              icon={<Icon icon={Pencil} />}
              onClick={onEdit}
            />
          </HStack>
        </>
      ) : null}
    </VStack>
  );
}
