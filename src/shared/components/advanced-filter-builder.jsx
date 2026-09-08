'use client';

import { DateInput } from '@astryxdesign/core/DateInput';
import { Grid } from '@astryxdesign/core/Grid';
import { HStack } from '@astryxdesign/core/HStack';
import { Icon } from '@astryxdesign/core/Icon';
import { IconButton } from '@astryxdesign/core/IconButton';
import { NumberInput } from '@astryxdesign/core/NumberInput';
import { Selector } from '@astryxdesign/core/Selector';
import { StackItem } from '@astryxdesign/core/Stack';
import { TextInput } from '@astryxdesign/core/TextInput';
import { VStack } from '@astryxdesign/core/VStack';
import { Trash2 } from 'lucide-react';

import { generateRowKey } from '@/shared/config/generate-row-key.js';

/** @typedef {'string' | 'enum' | 'number' | 'date'} AdvancedFilterFieldType */

/**
 * @typedef {Object} AdvancedFilterFieldDef
 * @property {string} key
 * @property {string} label
 * @property {AdvancedFilterFieldType} type
 * @property {ReadonlyArray<{ value: string, label?: string }>} [options] Required when type is 'enum'.
 */

/**
 * @typedef {Object} AdvancedFilterCondition
 * @property {string} id
 * @property {string} field
 * @property {string} operator
 * @property {string} value
 * @property {string} [valueTo] Only used by date fields (always `Between`).
 * @property {'And' | 'Or'} connector Ignored on the first condition.
 */

const CONNECTOR_OPTIONS = [
  { value: 'And', label: 'Và' },
  { value: 'Or', label: 'Hoặc' },
];

// Server-side operator set per field type — mirrors
// `CompanyManagement.Application.Common.Models.FilterOperator` in the
// backend (BE-CLEAN-ARCHITECTURE) exactly; date fields never show an
// operator (always `Between`, rendered as a Từ ngày/Đến ngày pair).
const OPERATORS_BY_TYPE = {
  string: [
    { value: 'Equals', label: 'Bằng' },
    { value: 'Contains', label: 'Chứa' },
    { value: 'NotContains', label: 'Không chứa' },
    { value: 'StartsWith', label: 'Bắt đầu với' },
    { value: 'EndsWith', label: 'Kết thúc với' },
    { value: 'IsEmpty', label: 'Trống' },
    { value: 'IsNotEmpty', label: 'Không trống' },
  ],
  enum: [
    { value: 'Equals', label: 'Bằng' },
    { value: 'NotEquals', label: 'Khác' },
  ],
  number: [
    { value: 'Equals', label: 'Bằng' },
    { value: 'NotEquals', label: 'Khác' },
    { value: 'LessThan', label: 'Nhỏ hơn' },
    { value: 'LessThanOrEqual', label: 'Nhỏ hơn hoặc bằng' },
    { value: 'GreaterThan', label: 'Lớn hơn' },
    { value: 'GreaterThanOrEqual', label: 'Lớn hơn hoặc bằng' },
  ],
  // Date fields never show an operator selector (always `Between`, rendered
  // as the Từ ngày/Đến ngày pair) — present so indexing by
  // `AdvancedFilterFieldType` type-checks everywhere, never read at runtime.
  date: [],
};

const VALUELESS_OPERATORS = new Set(['IsEmpty', 'IsNotEmpty']);

const CONDITION_COLUMNS = { minWidth: 200, max: 4 };

/** @param {AdvancedFilterFieldType} type */
function defaultOperatorFor(type) {
  return type === 'date' ? 'Between' : OPERATORS_BY_TYPE[type][0].value;
}

/** A new condition's id only needs to be unique within this browser tab's
 * lifetime (React keys, not persisted). A module-level counter isn't safe
 * for that: Fast Refresh re-executes this module (resetting the counter)
 * without remounting the component holding already-generated ids, so a
 * freshly added condition could collide with one from before the reload —
 * `generateRowKey()` (already the convention for row keys elsewhere in
 * this codebase, e.g. `use-shipment-cost-line-rows.js`) has no such
 * lifetime tied to the module. */
function makeConditionId() {
  return `condition-${generateRowKey()}`;
}

/**
 * One condition row's field/operator/value inputs — the field+operator+value
 * "advanced search" builder shown inside `AdvanceTable`'s "Bộ lọc nâng cao"
 * dialog. Purely controlled: the caller (`AdvanceTable`) owns the draft
 * conditions array and passes it back down; this component only renders rows
 * and reports edits via `onChange`.
 * @param {{
 *   fields: ReadonlyArray<AdvancedFilterFieldDef>,
 *   conditions: ReadonlyArray<AdvancedFilterCondition>,
 *   onChange: (conditions: AdvancedFilterCondition[]) => void,
 * }} props
 */
export function AdvancedFilterBuilder({ fields, conditions, onChange }) {
  const fieldsByKey = new Map(fields.map((field) => [field.key, field]));
  const usedFieldKeys = new Set(conditions.map((condition) => condition.field));

  /** @param {string} conditionId, @param {Partial<AdvancedFilterCondition>} patch */
  function updateCondition(conditionId, patch) {
    onChange(
      conditions.map((condition) =>
        condition.id === conditionId ? { ...condition, ...patch } : condition,
      ),
    );
  }

  /** @param {string} fieldKey */
  function addCondition(fieldKey) {
    const field = fieldsByKey.get(fieldKey);
    if (!field) return;
    onChange([
      ...conditions,
      {
        id: makeConditionId(),
        field: fieldKey,
        operator: defaultOperatorFor(field.type),
        value: '',
        valueTo: '',
        connector: 'And',
      },
    ]);
  }

  /** @param {string} conditionId */
  function removeCondition(conditionId) {
    onChange(conditions.filter((condition) => condition.id !== conditionId));
  }

  const availableFieldOptions = fields
    .filter((field) => !usedFieldKeys.has(field.key))
    .map((field) => ({ value: field.key, label: field.label }));

  return (
    <VStack gap={3} hAlign="stretch">
      {conditions.map((condition, index) => {
        const field = fieldsByKey.get(condition.field);
        if (!field) return null;
        const showsValue = !VALUELESS_OPERATORS.has(condition.operator);

        return (
          <VStack key={condition.id} gap={2} hAlign="stretch">
            {index > 0 ? (
              <Selector
                label="Kết hợp với điều kiện trước"
                isLabelHidden
                size="sm"
                width={100}
                options={CONNECTOR_OPTIONS}
                value={condition.connector}
                onChange={(next) =>
                  updateCondition(condition.id, {
                    connector: /** @type {'And' | 'Or'} */ (next ?? 'And'),
                  })
                }
              />
            ) : null}
            <HStack gap={2} vAlign="end">
              <StackItem size="fill">
                <Grid columns={CONDITION_COLUMNS} gap={2} align="end">
                  <Selector
                    label="Trường lọc"
                    size="sm"
                    width="100%"
                    options={[
                      { value: field.key, label: field.label },
                      ...availableFieldOptions,
                    ]}
                    value={condition.field}
                    onChange={(next) => {
                      if (!next) return;
                      const nextField = fieldsByKey.get(next);
                      if (!nextField) return;
                      updateCondition(condition.id, {
                        field: next,
                        operator: defaultOperatorFor(nextField.type),
                        value: '',
                        valueTo: '',
                      });
                    }}
                  />
                  {field.type === 'date' ? (
                    <>
                      <DateInput
                        label="Từ ngày"
                        size="sm"
                        width="100%"
                        value={
                          /** @type {import('@astryxdesign/core/Calendar').ISODateString | undefined} */ (
                            condition.value || undefined
                          )
                        }
                        onChange={(next) =>
                          updateCondition(condition.id, { value: next ?? '' })
                        }
                        format="system_date"
                      />
                      <DateInput
                        label="Đến ngày"
                        size="sm"
                        width="100%"
                        value={
                          /** @type {import('@astryxdesign/core/Calendar').ISODateString | undefined} */ (
                            condition.valueTo || undefined
                          )
                        }
                        onChange={(next) =>
                          updateCondition(condition.id, {
                            valueTo: next ?? '',
                          })
                        }
                        format="system_date"
                      />
                    </>
                  ) : (
                    <>
                      <Selector
                        label="Điều kiện"
                        size="sm"
                        width="100%"
                        options={OPERATORS_BY_TYPE[field.type]}
                        value={condition.operator}
                        onChange={(next) =>
                          updateCondition(condition.id, {
                            operator:
                              next ?? OPERATORS_BY_TYPE[field.type][0].value,
                          })
                        }
                      />
                      {showsValue && field.type === 'enum' ? (
                        <Selector
                          label="Giá trị"
                          size="sm"
                          width="100%"
                          hasClear
                          options={[...(field.options ?? [])]}
                          value={condition.value || null}
                          onChange={(next) =>
                            updateCondition(condition.id, {
                              value: next ?? '',
                            })
                          }
                        />
                      ) : null}
                      {showsValue && field.type === 'number' ? (
                        <NumberInput
                          label="Giá trị"
                          size="sm"
                          width="100%"
                          value={
                            condition.value === ''
                              ? null
                              : Number(condition.value)
                          }
                          onChange={(next) =>
                            updateCondition(condition.id, {
                              value: next == null ? '' : String(next),
                            })
                          }
                        />
                      ) : null}
                      {showsValue && field.type === 'string' ? (
                        <TextInput
                          label="Giá trị"
                          size="sm"
                          width="100%"
                          hasClear
                          value={condition.value}
                          onChange={(next) =>
                            updateCondition(condition.id, { value: next })
                          }
                        />
                      ) : null}
                    </>
                  )}
                </Grid>
              </StackItem>
              <IconButton
                label="Xoá điều kiện này"
                tooltip="Xoá"
                icon={<Icon icon={Trash2} size="sm" />}
                variant="ghost"
                size="sm"
                onClick={() => removeCondition(condition.id)}
              />
            </HStack>
          </VStack>
        );
      })}

      {availableFieldOptions.length > 0 ? (
        <Selector
          label="Chọn điều kiện lọc"
          placeholder="Chọn điều kiện lọc"
          size="sm"
          hasClear
          hasSearch
          options={availableFieldOptions}
          value={null}
          onChange={(next) => next && addCondition(next)}
        />
      ) : null}
    </VStack>
  );
}
