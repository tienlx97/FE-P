'use client';

import { Banner } from '@astryxdesign/core/Banner';
import {
  SegmentedControl,
  SegmentedControlItem,
} from '@astryxdesign/core/SegmentedControl';
import { Selector } from '@astryxdesign/core/Selector';
import { VStack } from '@astryxdesign/core/VStack';
import { useState } from 'react';

import { TextInput } from '@/shared/components/text-input.jsx';

const OLD_ADDRESS_FIELDS = [
  'oldProvince',
  'oldDistrict',
  'oldWard',
  'oldAddressDetail',
];
const NEW_ADDRESS_FIELDS = ['newProvince', 'newWard', 'newAddressDetail'];

/**
 * @param {Record<string, { type: 'error', message: string } | undefined>} fieldStatuses
 * @param {string[]} fields
 */
function hasErrorIn(fieldStatuses, fields) {
  return fields.some((field) => fieldStatuses[field]);
}

/**
 * Address block of the "Thông tin nhân viên" card. Both the pre-merger
 * ("cũ") and post-merger ("mới") address are still required at once — the
 * backend's `RegisterCommandValidator` wants both on file, see
 * `user-contact-fields.jsx` — so the segmented control only chooses which of
 * the two is *on screen*; neither set of values is cleared by switching, and
 * the submitted payload is unchanged from v1.
 *
 * Because half the required fields are hidden at any moment, a validation
 * error on the hidden half would otherwise be invisible: when that happens
 * the control flips to the offending standard (or, if both are invalid,
 * announces the other one in a banner) rather than leaving the Admin staring
 * at a form that refuses to submit for no visible reason.
 * @param {{
 *   values: import('../types/index.js').CreateUserFormValues | import('../types/index.js').EditUserFormValues,
 *   setField: (field: string, value: string | number | undefined) => void,
 *   fieldStatuses: Record<string, { type: 'error', message: string } | undefined>,
 *   oldProvinces: { code: string, name: string }[],
 *   oldDistricts: { code: string, name: string }[],
 *   oldWards: { code: string, name: string }[],
 *   newProvinces: { code: string, name: string }[],
 *   newWards: { code: string, name: string }[],
 * }} props
 */
export function UserAddressFields({
  values,
  setField,
  fieldStatuses,
  oldProvinces,
  oldDistricts,
  oldWards,
  newProvinces,
  newWards,
}) {
  const [standard, setStandard] = useState(
    /** @type {'old' | 'new'} */ ('old'),
  );

  const hasOldError = hasErrorIn(fieldStatuses, OLD_ADDRESS_FIELDS);
  const hasNewError = hasErrorIn(fieldStatuses, NEW_ADDRESS_FIELDS);
  const isHiddenSideInvalid = standard === 'old' ? hasNewError : hasOldError;
  const isShownSideInvalid = standard === 'old' ? hasOldError : hasNewError;

  // Adjusting state during render (React's own pattern for "derive from a
  // prop change"), keyed on which halves are failing rather than on an
  // effect: the flip has to happen once per new validation result, not
  // every time the Admin deliberately switches back to a clean half.
  const errorSignature = `${hasOldError}|${hasNewError}`;
  const [lastErrorSignature, setLastErrorSignature] = useState(errorSignature);

  if (errorSignature !== lastErrorSignature) {
    setLastErrorSignature(errorSignature);
    if (isHiddenSideInvalid && !isShownSideInvalid) {
      setStandard(standard === 'old' ? 'new' : 'old');
    }
  }

  return (
    <VStack gap={3} hAlign="stretch">
      <SegmentedControl
        label="Chuẩn địa chỉ"
        layout="fill"
        value={standard}
        onChange={(value) => setStandard(/** @type {'old' | 'new'} */ (value))}
      >
        <SegmentedControlItem value="old" label="Địa chỉ cũ (trước sáp nhập)" />
        <SegmentedControlItem value="new" label="Địa chỉ mới (sau sáp nhập)" />
      </SegmentedControl>

      {isHiddenSideInvalid && isShownSideInvalid ? (
        <Banner
          status="error"
          title={
            standard === 'old'
              ? 'Địa chỉ mới cũng còn thiếu thông tin — chuyển sang tab "Địa chỉ mới" để bổ sung.'
              : 'Địa chỉ cũ cũng còn thiếu thông tin — chuyển sang tab "Địa chỉ cũ" để bổ sung.'
          }
          container="card"
        />
      ) : null}

      {standard === 'old' ? (
        <>
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
            label="Số nhà, tên đường"
            value={values.oldAddressDetail}
            onChange={(value) => setField('oldAddressDetail', value)}
            isRequired
            status={fieldStatuses.oldAddressDetail}
            statusVariant="tooltip"
          />
        </>
      ) : (
        <>
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
            label="Số nhà, tên đường"
            value={values.newAddressDetail}
            onChange={(value) => setField('newAddressDetail', value)}
            isRequired
            status={fieldStatuses.newAddressDetail}
            statusVariant="tooltip"
          />
        </>
      )}
    </VStack>
  );
}
