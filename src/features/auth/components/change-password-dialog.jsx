'use client';

import { HStack } from '@astryxdesign/core/HStack';
import { Icon } from '@astryxdesign/core/Icon';
import { IconButton } from '@astryxdesign/core/IconButton';
import { StackItem } from '@astryxdesign/core/Stack';
import { TextInput } from '@astryxdesign/core/TextInput';
import { useState } from 'react';

import { generateRandomPassword } from '@/features/admin-users/config/generate-password.js';
import { FormDialog } from '@/shared/components/form-dialog.jsx';
import { IconShuffle } from '@/shared/components/icon/icon-shuffle.jsx';

import { useChangePasswordMutation } from '../hooks/use-change-password-mutation.js';

const MIN_PASSWORD_LENGTH = 8;

/**
 * Self-service counterpart to Admin's `ResetPasswordDialog`
 * (`admin-users/components/reset-password-dialog.jsx`) — same "keep the
 * dialog open on success" shape, but this one needs the caller's current
 * password (`POST /users/me/password`, unlike the Admin-only reset) and has
 * no target user to name in the title.
 * @param {{ isOpen: boolean, onOpenChange: (isOpen: boolean) => void }} props
 */
export function ChangePasswordDialog({ isOpen, onOpenChange }) {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const changePasswordMutation = useChangePasswordMutation();

  /** @param {boolean} nextIsOpen */
  function handleOpenChange(nextIsOpen) {
    if (!nextIsOpen) {
      // Cleared on close, not on open — see ResetPasswordDialog's identical
      // note.
      setCurrentPassword('');
      setNewPassword('');
      setError('');
      setSuccessMessage('');
    }
    onOpenChange(nextIsOpen);
  }

  /** @param {import('react').FormEvent<HTMLFormElement>} event */
  async function handleSubmit(event) {
    event.preventDefault();
    setError('');

    if (newPassword.trim().length < MIN_PASSWORD_LENGTH) {
      setError(`Mật khẩu mới phải có ít nhất ${MIN_PASSWORD_LENGTH} ký tự`);
      return;
    }

    const result = await changePasswordMutation.mutateAsync({
      currentPassword,
      newPassword,
    });

    if (!result.success) {
      setError(result.message);
      return;
    }

    setSuccessMessage('Đã đổi mật khẩu thành công.');
    setCurrentPassword('');
    setNewPassword('');
  }

  return (
    <FormDialog
      isOpen={isOpen}
      onOpenChange={handleOpenChange}
      title="Đổi mật khẩu"
      submitLabel="Đổi mật khẩu"
      width={440}
      draft={{ currentPassword, newPassword }}
      isSubmitting={changePasswordMutation.isPending}
      isReady={!successMessage}
      submitError={error}
      onSubmit={handleSubmit}
      successMessage={successMessage}
    >
      {!successMessage ? (
        <>
          <TextInput
            label="Mật khẩu hiện tại"
            value={currentPassword}
            onChange={setCurrentPassword}
            type="password"
            isRequired
          />
          <HStack gap={2}>
            <StackItem size="fill">
              <TextInput
                label="Mật khẩu mới"
                value={newPassword}
                onChange={setNewPassword}
                type="text"
                placeholder="Tối thiểu 8 ký tự, có hoa/thường/số/ký tự đặc biệt"
                isRequired
              />
            </StackItem>
            <StackItem crossAlignSelf="end">
              <IconButton
                label="Tạo mật khẩu ngẫu nhiên"
                tooltip="Ngẫu nhiên"
                icon={<Icon icon={IconShuffle} size="sm" />}
                type="button"
                variant="secondary"
                onClick={() => setNewPassword(generateRandomPassword())}
              />
            </StackItem>
          </HStack>
        </>
      ) : null}
    </FormDialog>
  );
}
