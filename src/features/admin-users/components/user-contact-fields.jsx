'use client';

import { Selector } from '@astryxdesign/core/Selector';
import { Text } from '@astryxdesign/core/Text';
import { VStack } from '@astryxdesign/core/VStack';

import { TextInput } from '@/shared/components/text-input.jsx';

/**
 * "Thông tin liên hệ" tab content: phone + address — mirrors the reference
 * layout's grouping (phone and address together, separate from the
 * always-visible identity/org fields above the tab strip).
 *
 * Right after the 2025 administrative merger, a user's ID still references
 * the old (pre-merger) units while the business also needs the new
 * (post-merger) ones on file — so both address blocks are captured at
 * once, not a choice between them (BE-kt-xnk `RegisterCommandValidator`).
 * Province/district/ward are `Selector`s backed by real Vietnam
 * administrative-unit data (see `use-vn-address.js`), not free text — the
 * form still stores each as a plain display-name string (same contract as
 * before, see `register.js`'s `OldProvince`/`OldDistrict`/`OldWard`/
 * `NewProvince`/`NewWard`), so picking a province just changes which
 * option list the next level down draws from.
 * @param {{
 *   values: import('../types/index.js').CreateUserFormValues | import('../types/index.js').EditUserFormValues,
 *   setField: (field: string, value: string) => void,
 *   fieldStatuses: Record<string, { type: 'error', message: string } | undefined>,
 *   oldProvinces: { code: string, name: string }[],
 *   oldDistricts: { code: string, name: string }[],
 *   oldWards: { code: string, name: string }[],
 *   newProvinces: { code: string, name: string }[],
 *   newWards: { code: string, name: string }[],
 * }} props
 */
export function UserContactFields({
  values,
  setField,
  fieldStatuses,
  oldProvinces,
  oldDistricts,
  oldWards,
  newProvinces,
  newWards,
}) {
  return (
    <VStack gap={3} hAlign="stretch">
      <TextInput
        label="Số điện thoại"
        value={values.phone}
        onChange={(value) => setField('phone', value)}
        placeholder="Số 10 chữ số, bắt đầu bằng 0"
        isRequired
        status={fieldStatuses.phone}
        statusVariant="tooltip"
      />

      <Text type="label" color="secondary">
        Địa chỉ theo chuẩn cũ (trước sáp nhập)
      </Text>

      <Selector
        label="Tỉnh/Thành phố"
        hasSearch
        placeholder="Chọn tỉnh/thành phố"
        value={values.oldProvince}
        onChange={(value) => setField('oldProvince', value ?? '')}
        options={oldProvinces.map((province) => ({
          value: province.name,
          label: province.name,
        }))}
        isRequired
        status={fieldStatuses.oldProvince}
        statusVariant="tooltip"
        width="100%"
      />

      <Selector
        label="Quận/Huyện"
        hasSearch
        placeholder="Chọn quận/huyện"
        value={values.oldDistrict}
        onChange={(value) => setField('oldDistrict', value ?? '')}
        options={oldDistricts.map((district) => ({
          value: district.name,
          label: district.name,
        }))}
        isDisabled={!values.oldProvince}
        disabledMessage="Chọn tỉnh/thành phố trước"
        isRequired
        status={fieldStatuses.oldDistrict}
        statusVariant="tooltip"
        width="100%"
      />

      <Selector
        label="Phường/Xã"
        hasSearch
        placeholder="Chọn phường/xã"
        value={values.oldWard}
        onChange={(value) => setField('oldWard', value ?? '')}
        options={oldWards.map((ward) => ({
          value: ward.name,
          label: ward.name,
        }))}
        isDisabled={!values.oldDistrict}
        disabledMessage="Chọn quận/huyện trước"
        isRequired
        status={fieldStatuses.oldWard}
        statusVariant="tooltip"
        width="100%"
      />

      <TextInput
        label="Số nhà, tên đường (địa chỉ cũ)"
        value={values.oldAddressDetail}
        onChange={(value) => setField('oldAddressDetail', value)}
        isRequired
        status={fieldStatuses.oldAddressDetail}
        statusVariant="tooltip"
      />

      <Text type="label" color="secondary">
        Địa chỉ theo chuẩn mới (sau sáp nhập)
      </Text>

      <Selector
        label="Tỉnh/Thành phố"
        hasSearch
        placeholder="Chọn tỉnh/thành phố"
        value={values.newProvince}
        onChange={(value) => setField('newProvince', value ?? '')}
        options={newProvinces.map((province) => ({
          value: province.name,
          label: province.name,
        }))}
        isRequired
        status={fieldStatuses.newProvince}
        statusVariant="tooltip"
        width="100%"
      />

      <Selector
        label="Phường/Xã"
        hasSearch
        placeholder="Chọn phường/xã"
        value={values.newWard}
        onChange={(value) => setField('newWard', value ?? '')}
        options={newWards.map((ward) => ({
          value: ward.name,
          label: ward.name,
        }))}
        isDisabled={!values.newProvince}
        disabledMessage="Chọn tỉnh/thành phố trước"
        isRequired
        status={fieldStatuses.newWard}
        statusVariant="tooltip"
        width="100%"
      />

      <TextInput
        label="Số nhà, tên đường (địa chỉ mới)"
        value={values.newAddressDetail}
        onChange={(value) => setField('newAddressDetail', value)}
        isRequired
        status={fieldStatuses.newAddressDetail}
        statusVariant="tooltip"
      />
    </VStack>
  );
}
