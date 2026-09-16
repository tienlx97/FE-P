'use client';

import { Avatar } from '@astryxdesign/core/Avatar';
import { HStack } from '@astryxdesign/core/HStack';
import { Icon } from '@astryxdesign/core/Icon';
import { IconButton } from '@astryxdesign/core/IconButton';
import { StackItem } from '@astryxdesign/core/Stack';
import { Text } from '@astryxdesign/core/Text';
import { VStack } from '@astryxdesign/core/VStack';

import { FormGrid } from '@/shared/components/form-grid.jsx';
import { IconShuffle } from '@/shared/components/icon/icon-shuffle.jsx';
import { TextInput } from '@/shared/components/text-input.jsx';

import { generateRandomPassword } from '../config/generate-password.js';

/**
 * "Thông tin khởi tạo" — the v2 dialog's only always-open card: the minimum
 * needed to identify the person being created. Everything else sits behind a
 * collapsed card (`user-form-dialog.jsx`).
 *
 * The avatar is a placeholder: it renders the initials Avatar the rest of
 * the app already uses, with no upload affordance, because there is no
 * avatar field on the user record or upload endpoint yet. It is shown
 * rather than omitted so the card's final layout is settled now and adding
 * upload later is a one-component change, not a re-layout. The column is
 * pinned to the avatar's own width (96px, matching `size={96}` below) —
 * without it, a wider child (a button label, a longer caption) stretches
 * the column past the avatar and the row reads as lopsided.
 * @param {{
 *   values: import('../types/index.js').CreateUserFormValues | import('../types/index.js').EditUserFormValues,
 *   setField: (field: string, value: string | number | undefined) => void,
 *   fieldStatuses: Record<string, { type: 'error', message: string } | undefined>,
 *   password: string | null,
 * }} props
 */
export function UserIdentityFields({
  values,
  setField,
  fieldStatuses,
  password,
}) {
  const fullName = `${values.lastName} ${values.firstName}`.trim();

  return (
    <FormGrid>
      <StackItem>
        <VStack gap={2} hAlign="center" width={200}>
          <Avatar
            size={144}
            name={fullName || 'Người dùng mới'}
            tooltip={false}
          />
          <Text type="label" color="secondary">
            Sắp có
          </Text>
        </VStack>
      </StackItem>

      <StackItem size="fill">
        <VStack gap={3} hAlign="stretch">
          <FormGrid>
            <StackItem size="fill">
              <TextInput
                label="Họ"
                value={values.lastName}
                onChange={(value) => setField('lastName', value)}
                isRequired
                status={fieldStatuses.lastName}
                statusVariant="tooltip"
              />
            </StackItem>
            <StackItem size="fill">
              <TextInput
                label="Tên"
                value={values.firstName}
                onChange={(value) => setField('firstName', value)}
                isRequired
                status={fieldStatuses.firstName}
                statusVariant="tooltip"
              />
            </StackItem>
          </FormGrid>

          <TextInput
            label="Số điện thoại"
            value={values.phone}
            onChange={(value) => setField('phone', value)}
            placeholder="Số 10 chữ số, bắt đầu bằng 0"
            isRequired
            status={fieldStatuses.phone}
            statusVariant="tooltip"
          />

          {/* Edit mode passes `null`: `PUT /users/{id}` doesn't accept a
              password, it has its own reset endpoint. */}
          {password === null ? null : (
            <HStack gap={2}>
              <StackItem size="fill">
                <TextInput
                  label="Mật khẩu tạm"
                  value={password}
                  onChange={(value) => setField('password', value)}
                  type="text"
                  placeholder="Tối thiểu 8 ký tự, có hoa/thường/số/ký tự đặc biệt"
                  isRequired
                  status={fieldStatuses.password}
                  statusVariant="tooltip"
                />
              </StackItem>
              <StackItem crossAlignSelf="end">
                <IconButton
                  label="Tạo mật khẩu ngẫu nhiên"
                  tooltip="Ngẫu nhiên"
                  icon={<Icon icon={IconShuffle} size="sm" />}
                  type="button"
                  variant="secondary"
                  onClick={() => setField('password', generateRandomPassword())}
                />
              </StackItem>
            </HStack>
          )}
        </VStack>
      </StackItem>
    </FormGrid>
  );
}
