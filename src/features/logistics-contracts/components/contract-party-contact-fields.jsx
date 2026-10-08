'use client';

import { Grid } from '@astryxdesign/core/Grid';
import { Selector } from '@astryxdesign/core/Selector';
import { Text } from '@astryxdesign/core/Text';
import { VStack } from '@astryxdesign/core/VStack';

import {
  MetaFormCard,
  MetaPill,
} from '@/shared/components/custom/meta/index.js';
import { TextInput } from '@/shared/components/text-input.jsx';

import { partyKindNeedsName, partyNameLabel } from '../config/party-kinds.js';

const TWO_COLUMNS = { minWidth: 240, max: 2 };
const NONE = '__none__';

/**
 * One Consignee / Notify Party card of the contract form: how it reads on
 * the B/L (kind), then name (only where the kind needs one) and address.
 * Catalog link and extra fields are carried by the form value untouched
 * (see `partyPayload`).
 * @param {{
 *   title: string,
 *   value: import('../types/index.js').PartyFormValue,
 *   kindOptions: { value: import('../types/index.js').PartyKind, label: string }[],
 *   onChange: (next: import('../types/index.js').PartyFormValue) => void,
 *   nameStatus?: { type: 'error' | 'success', message: string },
 *   isReadOnly?: boolean,
 *   isFlat?: boolean,
 * }} props
 *
 * `isFlat` drops the card: the title becomes a small heading, for a section
 * that is already a card (the contract drawer's Consignee / Notify columns).
 */
export function ContractPartyContactFields({
  title,
  value,
  kindOptions,
  onChange,
  nameStatus,
  isReadOnly = false,
  isFlat = false,
}) {
  const needsName = partyKindNeedsName(value.kind);

  const fields = (
    <>
      <Grid columns={TWO_COLUMNS} gap={4}>
        <Selector
          label="Cách ghi trên B/L"
          value={value.kind || NONE}
          onChange={(kind) =>
            onChange({
              ...value,
              kind:
                !kind || kind === NONE
                  ? ''
                  : /** @type {import('../types/index.js').PartyKind} */ (kind),
            })
          }
          options={[{ value: NONE, label: 'Không có' }, ...kindOptions]}
          isDisabled={isReadOnly}
        />
        {needsName ? (
          <TextInput
            label={partyNameLabel(value.kind)}
            value={value.name}
            onChange={(name) => onChange({ ...value, name })}
            isRequired
            isReadOnly={isReadOnly}
            status={nameStatus}
            statusVariant="tooltip"
          />
        ) : null}
      </Grid>
      {value.kind ? (
        <TextInput
          label="Địa chỉ"
          value={value.address}
          onChange={(address) => onChange({ ...value, address })}
          isOptional
          isReadOnly={isReadOnly}
        />
      ) : null}
      {value.extraFields.length > 0 ? (
        <Text size="sm" color="secondary">
          {value.extraFields
            .map((field) => `${field.key}: ${field.value}`)
            .join(' · ')}
        </Text>
      ) : null}
    </>
  );

  return isFlat ? (
    <VStack gap={3} hAlign="stretch">
      <Text type="label" weight="bold" color="secondary">
        {title}
      </Text>
      {fields}
    </VStack>
  ) : (
    <MetaFormCard header={<MetaPill label={title} tone="neutral" />}>
      {fields}
    </MetaFormCard>
  );
}
