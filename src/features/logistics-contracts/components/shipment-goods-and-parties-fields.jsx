'use client';

import { CheckboxInput } from '@astryxdesign/core/CheckboxInput';
import { Grid } from '@astryxdesign/core/Grid';
import { Text } from '@astryxdesign/core/Text';
import { VStack } from '@astryxdesign/core/VStack';

import { FormattedNumberTextInput } from '@/shared/components/formatted-number-text-input.jsx';

import {
  consigneeKindOptions,
  notifyPartyKindOptions,
  partyFormValueFrom,
} from '../config/party-kinds.js';
import { ContractPartyContactFields } from './contract-party-contact-fields.jsx';

const LINE_COLUMNS = { minWidth: 220, max: 2 };

/**
 * Goods of the contract carried by this shipment (one quantity per contract
 * goods line; empty = not carried — several lines = several HS codes) and
 * its Consignee / Notify Party: "Theo hợp đồng" shows the contract's
 * current party, "Tùy chỉnh" edits the shipment's own (BE-P
 * `PartyOverrides`; after the B/L is issued the backend keeps it frozen).
 * @param {{
 *   contract: import('../types/index.js').Contract,
 *   goodsLines: Record<string, number | undefined>,
 *   onGoodsLineChange: (contractLineId: string, quantity: number | undefined) => void,
 *   consigneeOverride: import('../types/index.js').PartyFormValue | null,
 *   notifyPartyOverride: import('../types/index.js').PartyFormValue | null,
 *   onPartyOverrideChange: (role: 'consigneeOverride' | 'notifyPartyOverride', value: import('../types/index.js').PartyFormValue | null) => void,
 *   isDisabled?: boolean,
 * }} props
 */
export function ShipmentGoodsAndPartiesFields({
  contract,
  goodsLines,
  onGoodsLineChange,
  consigneeOverride,
  notifyPartyOverride,
  onPartyOverrideChange,
  isDisabled = false,
}) {
  const lines = contract.lines ?? [];

  /**
   * @param {'consigneeOverride' | 'notifyPartyOverride'} role
   * @param {string} title
   * @param {import('../types/index.js').PartyFormValue | null} override
   * @param {import('../types/index.js').ContractPartyContact | null} inherited
   * @param {{ value: import('../types/index.js').PartyKind, label: string }[]} kindOptions
   */
  function partyBlock(role, title, override, inherited, kindOptions) {
    return (
      <VStack gap={2} hAlign="stretch">
        <CheckboxInput
          label={`${title}: tùy chỉnh riêng cho lô này`}
          size="sm"
          value={override !== null}
          isDisabled={isDisabled}
          onChange={(checked) =>
            onPartyOverrideChange(
              role,
              checked ? partyFormValueFrom(inherited) : null,
            )
          }
        />
        {override ? (
          <ContractPartyContactFields
            title={title}
            value={override}
            kindOptions={kindOptions}
            onChange={(next) => onPartyOverrideChange(role, next)}
            isReadOnly={isDisabled}
          />
        ) : (
          <Text color="secondary">
            Theo hợp đồng:{' '}
            {inherited ? (inherited.displayName ?? inherited.name) : 'Không có'}
          </Text>
        )}
      </VStack>
    );
  }

  return (
    <VStack gap={4} hAlign="stretch">
      {lines.length === 0 ? (
        <Text color="secondary">
          Hợp đồng chưa có danh mục hàng hóa — thêm ở hồ sơ hợp đồng để ghi số
          lượng xuất theo từng dòng hàng.
        </Text>
      ) : (
        <Grid columns={LINE_COLUMNS} gap={3}>
          {lines.map((line) => (
            <FormattedNumberTextInput
              key={line.id}
              label={`${line.description}${line.hsCode ? ` · HS ${line.hsCode}` : ''}`}
              description={`Hợp đồng: ${line.quantity.toLocaleString('vi-VN')} ${line.unit}`}
              value={goodsLines[line.id]}
              onChange={(value) => onGoodsLineChange(line.id, value)}
              units={line.unit}
              isReadOnly={isDisabled}
            />
          ))}
        </Grid>
      )}
      {partyBlock(
        'consigneeOverride',
        'CONSIGNEE',
        consigneeOverride,
        contract.consignee,
        consigneeKindOptions,
      )}
      {partyBlock(
        'notifyPartyOverride',
        'NOTIFY PARTY',
        notifyPartyOverride,
        contract.notifyParty,
        notifyPartyKindOptions,
      )}
    </VStack>
  );
}
