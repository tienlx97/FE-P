'use client';

import { DateInput } from '@astryxdesign/core/DateInput';
import { Divider } from '@astryxdesign/core/Divider';
import { NumberInput } from '@astryxdesign/core/NumberInput';
import { RadioList, RadioListItem } from '@astryxdesign/core/RadioList';
import { StackItem } from '@astryxdesign/core/Stack';
import { Text } from '@astryxdesign/core/Text';
import { TextInput } from '@astryxdesign/core/TextInput';
import { VStack } from '@astryxdesign/core/VStack';

import { FormGrid } from '@/shared/components/form-grid.jsx';
import { formatDateInputValue } from '@/shared/config/date-input-format.js';

import { UserAddressFields } from './user-address-fields.jsx';

/**
 * "Thông tin nhân viên" card of the v2 dialog: the identity-document and
 * address details, i.e. everything the person's papers say about them, kept
 * out of the always-open first card because it is the longest section and
 * the least often edited.
 *
 * Gender offers only Nam/Nữ per the v2 spec, even though the API's enum also
 * has `Other` — an existing record already set to `Other` would otherwise
 * render as "nothing selected" and force a change on save, so the third
 * option appears only for those records.
 * @param {{
 *   values: import('../types/index.js').CreateUserFormValues | import('../types/index.js').EditUserFormValues,
 *   setField: (field: string, value: string | number | undefined) => void,
 *   fieldStatuses: Record<string, { type: 'error', message: string } | undefined>,
 *   editableNationalId: string,
 *   readOnlyEmployeeCode: string | null,
 *   oldProvinces: { code: string, name: string }[],
 *   oldDistricts: { code: string, name: string }[],
 *   oldWards: { code: string, name: string }[],
 *   newProvinces: { code: string, name: string }[],
 *   newWards: { code: string, name: string }[],
 * }} props
 */
export function UserEmployeeFields({
  values,
  setField,
  fieldStatuses,
  editableNationalId,
  readOnlyEmployeeCode,
  oldProvinces,
  oldDistricts,
  oldWards,
  newProvinces,
  newWards,
}) {
  return (
    <VStack gap={3} hAlign="stretch">
      <FormGrid>
        <StackItem size="fill">
          <NumberInput
            label="Năm sinh"
            value={values.yearOfBirth}
            onChange={(value) => setField('yearOfBirth', value)}
            min={1900}
            isIntegerOnly
            isRequired
            status={fieldStatuses.yearOfBirth}
            statusVariant="tooltip"
          />
        </StackItem>
        <StackItem size="fill">
          <RadioList
            label="Giới tính"
            orientation="horizontal"
            value={values.gender}
            onChange={(value) => setField('gender', value)}
            status={fieldStatuses.gender}
            size="sm"
          >
            <RadioListItem label="Nam" value="Male" />
            <RadioListItem label="Nữ" value="Female" />
            {values.gender === 'Other' ? (
              <RadioListItem label="Khác" value="Other" />
            ) : null}
          </RadioList>
        </StackItem>
      </FormGrid>

      {/* CCCD is correctable — the login identifier is EmployeeCode, shown
          read-only below when editing an existing account. */}
      <TextInput
        label="Số CCCD"
        value={editableNationalId}
        onChange={(value) => setField('nationalId', value)}
        placeholder="Nhập số CCCD (12 số)"
        isRequired
        status={fieldStatuses.nationalId}
        statusVariant="tooltip"
      />

      {readOnlyEmployeeCode !== null ? (
        <VStack gap={1}>
          <Text type="label" color="secondary">
            Mã nhân viên (dùng để đăng nhập)
          </Text>
          <Text>{readOnlyEmployeeCode}</Text>
        </VStack>
      ) : null}

      <FormGrid>
        <StackItem size="fill">
          <DateInput
            label="Ngày cấp CCCD"
            value={
              /** @type {import('@astryxdesign/core/Calendar').ISODateString | undefined} */ (
                values.nationalIdIssueDate || undefined
              )
            }
            onChange={(value) => setField('nationalIdIssueDate', value ?? '')}
            format={formatDateInputValue}
            isRequired
            status={fieldStatuses.nationalIdIssueDate}
            statusVariant="tooltip"
          />
        </StackItem>
        <StackItem size="fill">
          <TextInput
            label="Nơi cấp"
            value={values.nationalIdIssuePlace}
            onChange={(value) => setField('nationalIdIssuePlace', value)}
            isRequired
            status={fieldStatuses.nationalIdIssuePlace}
            statusVariant="tooltip"
          />
        </StackItem>
      </FormGrid>

      <TextInput
        label="Số hộ chiếu"
        description="Không bắt buộc"
        value={values.passportNumber}
        onChange={(value) => setField('passportNumber', value)}
        status={fieldStatuses.passportNumber}
        statusVariant="tooltip"
      />

      <Divider />

      <UserAddressFields
        values={values}
        setField={setField}
        fieldStatuses={fieldStatuses}
        oldProvinces={oldProvinces}
        oldDistricts={oldDistricts}
        oldWards={oldWards}
        newProvinces={newProvinces}
        newWards={newWards}
      />
    </VStack>
  );
}
