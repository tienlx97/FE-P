'use client';

import { Button } from '@astryxdesign/core/Button';
import { useMediaQuery } from '@astryxdesign/core/hooks';
import { HStack } from '@astryxdesign/core/HStack';
import { Icon } from '@astryxdesign/core/Icon';
import { List, ListItem } from '@astryxdesign/core/List';
import {
  MetadataList,
  MetadataListItem as RawMetadataListItem,
} from '@astryxdesign/core/MetadataList';
import { Table } from '@astryxdesign/core/Table';
import { Text } from '@astryxdesign/core/Text';
import { VStack } from '@astryxdesign/core/VStack';
import { Plus } from 'lucide-react';

import { UnderlinedMetadataListItem as MetadataListItem } from '@/shared/components/expandable-row-styles.jsx';

import { labelForContractType } from '../config/contract-types.js';
import { formatMoney } from '../config/currencies.js';

/** @typedef {'info' | 'paymentSchedule' | 'shipment' | 'commission'} ExpandedTab */

/** @param {string | null | undefined} value */
function orDash(value) {
  return value == null || value === '' ? '—' : value;
}

/**
 * A blank grid cell — `MetadataListItem` has no first-class "empty slot"
 * (`label`/`children` are both meant to be filled in), so this fakes one
 * purely to pad a row out to a multiple of `columns`. Keeps the expanded
 * panel's info grid a single responsive `MetadataList` — so every
 * row's 4 columns are the same width and line up with each other — while
 * still visually grouping fields onto their own row even when a row has
 * fewer than 4 fields (see `commissions-list.jsx`'s identical
 * technique). Uses the raw (unwrapped) `MetadataListItem` so the spacer
 * doesn't pick up the field underline every real item gets — an empty
 * underlined box would read as a broken field, not blank padding.
 * @param {string} key
 */
function metadataSpacer(key) {
  return (
    <RawMetadataListItem key={key} label="">
      {''}
    </RawMetadataListItem>
  );
}
/** @param {{
 * contract: import('../types/index.js').Contract,
 * banksById: Map<string, import('../types/index.js').ContractBank>,
 * countriesById: Map<string, import('../types/index.js').Country>,
 * onAddAnnex: () => void,
 * annexes: import('../types/index.js').ContractAnnex[],
 * contractGrandTotal: number,
 * paymentTermRows: (import('../types/index.js').PaymentTerm & { orderLabel: string })[],
 * paymentTermColumns: import('@astryxdesign/core/Table').TableColumn<import('../types/index.js').PaymentTerm & { orderLabel: string }>[],
 * annexColumns: import('@astryxdesign/core/Table').TableColumn<import('../types/index.js').ContractAnnex & Record<string, unknown>>[],
 * }} props */
export function ContractInfoTab({
  contract,
  banksById,
  countriesById,
  onAddAnnex,
  annexes,
  contractGrandTotal,
  paymentTermRows,
  paymentTermColumns,
  annexColumns,
}) {
  const isNarrow = useMediaQuery('(max-width: 640px)');
  return (
    <VStack gap={4} hAlign="stretch">
      {/* Four aligned columns on desktop, two readable columns on mobile. */}
      <MetadataList columns={isNarrow ? 2 : 4} label={{ position: 'top' }}>
        <MetadataListItem label="Số hợp đồng">
          {contract.contractNumber}
        </MetadataListItem>
        <MetadataListItem label="Dự án">
          {contract.projectName}
        </MetadataListItem>
        <MetadataListItem label="Hạng mục">
          {orDash(contract.category)}
        </MetadataListItem>
        <MetadataListItem label="Nước xuất khẩu">
          {orDash(countriesById.get(contract.countryId)?.name)}
        </MetadataListItem>
        <MetadataListItem label="Ngày tạo">
          {orDash(contract.createdDate)}
        </MetadataListItem>
        <MetadataListItem label="Ngày báo giá">
          {orDash(contract.quotationDate)}
        </MetadataListItem>
        <MetadataListItem label="Loại hợp đồng">
          {labelForContractType(contract.contractType)}
        </MetadataListItem>
        {metadataSpacer('row2-pad-1')}
        <MetadataListItem label="Incoterm">
          {contract.incoterm}
        </MetadataListItem>
        <MetadataListItem label="Năm">{contract.incotermYear}</MetadataListItem>
        <MetadataListItem label="Cảng/nơi xếp hàng">
          {orDash(contract.placeOfLoading)}
        </MetadataListItem>
        <MetadataListItem label="Cảng/nơi đến">
          {orDash(contract.placeOfDischarge)}
        </MetadataListItem>
      </MetadataList>

      {/* Row 4: Giá trị, Ghi chú (chiếm 2 ô) — `MetadataListItem` has
              no colSpan, so this is its own columns={2} block instead:
              each item is 1 of 2 columns here, the same width as 2 of the
              4 columns above, which is the closest approximation of "Ghi
              chú spans 2 cells" the component supports. It doesn't share
              the grid tracks of the rows above (a real limitation, not an
              oversight — see `harness/PROGRESS.md`). */}
      <MetadataList columns={2} label={{ position: 'top' }}>
        <MetadataListItem label="Giá trị">
          {formatMoney(contract.contractValue, contract.currency)}
        </MetadataListItem>
        <MetadataListItem label="Ghi chú">
          {orDash(contract.note)}
        </MetadataListItem>
      </MetadataList>

      <MetadataList columns={2} label={{ position: 'top' }}>
        <MetadataListItem label="Bên bán ký">
          {contract.sellerSigned ? 'Đã ký' : 'Chưa ký'}
        </MetadataListItem>
        <MetadataListItem label="Bên mua ký">
          {contract.buyerSigned ? 'Đã ký' : 'Chưa ký'}
        </MetadataListItem>
      </MetadataList>

      {/* Bên bán — pulled down from the old "Bên bán" tab. */}
      <VStack gap={2} hAlign="stretch">
        <Text weight="semibold">Bên bán</Text>
        <MetadataList columns={isNarrow ? 2 : 4} label={{ position: 'top' }}>
          <MetadataListItem label="Tên công ty">
            {contract.seller.companyName}
          </MetadataListItem>
          <MetadataListItem label="Người đại diện">
            {orDash(contract.seller.representativeName)}
          </MetadataListItem>
          <MetadataListItem label="Chức vụ">
            {orDash(contract.seller.representativeTitle)}
          </MetadataListItem>
          <MetadataListItem label="Địa chỉ">
            {orDash(contract.seller.address)}
          </MetadataListItem>
          {contract.seller.extraFields.map((field) => (
            <MetadataListItem key={field.key} label={field.key}>
              {orDash(field.value)}
            </MetadataListItem>
          ))}
        </MetadataList>
      </VStack>

      {/* Khách hàng — pulled down from the old "Khách hàng" tab. */}
      <VStack gap={2} hAlign="stretch">
        <Text weight="semibold">Khách hàng</Text>
        <MetadataList columns={isNarrow ? 2 : 4} label={{ position: 'top' }}>
          <MetadataListItem label="Tên công ty">
            {contract.buyer.companyName}
          </MetadataListItem>
          <MetadataListItem label="Người đại diện">
            {orDash(contract.buyer.representativeName)}
          </MetadataListItem>
          <MetadataListItem label="Chức vụ">
            {orDash(contract.buyer.representativeTitle)}
          </MetadataListItem>
          <MetadataListItem label="Địa chỉ">
            {orDash(contract.buyer.address)}
          </MetadataListItem>
          {contract.buyer.extraFields.map((field) => (
            <MetadataListItem key={field.key} label={field.key}>
              {orDash(field.value)}
            </MetadataListItem>
          ))}
        </MetadataList>
      </VStack>

      {/* Ngân hàng — pulled down from the old "Ngân hàng" tab. */}
      <VStack gap={2} hAlign="stretch">
        <Text weight="semibold">Ngân hàng</Text>
        {contract.bankIds.length === 0 ? (
          <Text color="secondary">Chưa có ngân hàng thụ hưởng</Text>
        ) : (
          <List hasDividers density="compact">
            {contract.bankIds.map((bankId) => {
              const bank = banksById.get(bankId);
              return (
                <ListItem
                  key={bankId}
                  label={bank?.bankName || 'Ngân hàng chưa đặt tên'}
                  description={
                    bank
                      ? [
                          bank.beneficiary,
                          bank.bankAccountNumber,
                          bank.branchName,
                        ]
                          .filter(Boolean)
                          .join(' · ') || undefined
                      : undefined
                  }
                />
              );
            })}
          </List>
        )}
      </VStack>

      {/* Đợt thanh toán */}
      <VStack gap={2} hAlign="stretch">
        <Text weight="semibold">Đợt thanh toán (Hợp đồng)</Text>
        {contract.paymentTerms.length === 0 ? (
          <Text color="secondary">Chưa có đợt thanh toán</Text>
        ) : (
          <Table
            columns={paymentTermColumns}
            data={paymentTermRows}
            idKey="id"
            dividers="rows"
            density="compact"
          />
        )}
      </VStack>

      {/* Phụ lục — pulled down from the old "Phụ lục" tab, styled to
              match `commissions-list.jsx`'s annex list: label +
              signed amount on the top line, sign/dates/parties below. */}
      <HStack hAlign="between" vAlign="center">
        <Text weight="semibold">Phụ lục hợp đồng</Text>
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
        <Table
          columns={annexColumns}
          data={annexes}
          idKey="id"
          dividers="rows"
          density="compact"
        />
      )}

      <HStack hAlign="between" vAlign="center">
        <Text weight="semibold">Tổng cộng:</Text>
        <Text weight="semibold">
          {formatMoney(contractGrandTotal, contract.currency)}
        </Text>
      </HStack>
    </VStack>
  );
}
