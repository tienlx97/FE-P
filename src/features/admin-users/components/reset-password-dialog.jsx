'use client';

import { HStack } from '@astryxdesign/core/HStack';
import { Icon } from '@astryxdesign/core/Icon';
import { IconButton } from '@astryxdesign/core/IconButton';
import { StackItem } from '@astryxdesign/core/Stack';
import { TextInput } from '@astryxdesign/core/TextInput';
import { useState } from 'react';

import { FormDialog } from '@/shared/components/form-dialog.jsx';
import { IconShuffle } from '@/shared/components/icon/icon-shuffle.jsx';

import { generateRandomPassword } from '../config/generate-password.js';
import { useResetPasswordMutation } from '../hooks/use-reset-password-mutation.js';

const MIN_PASSWORD_LENGTH = 8;

/**
 * Admin action: sets a new password for `user` directly, no current password
 * needed (`POST /users/{id}/password/reset` — see `api/users.js`). There is
 * no email/SMS delivery on the backend, so once this succeeds the new
 * password lives nowhere else — the success banner keeps it on screen so the
 * Admin can copy it before closing the dialog instead of losing it if they
 * dismiss too fast.
 * @param {{
 *   isOpen: boolean,
 *   onOpenChange: (isOpen: boolean) => void,
 *   user: { id: string, firstName: string, lastName: string },
 * }} props
 */
export function ResetPasswordDialog({ isOpen, onOpenChange, user }) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [resetPasswordValue, setResetPasswordValue] = useState('');

  const resetPasswordMutation = useResetPasswordMutation(user.id);

  const fullName = `${user.firstName} ${user.lastName}`.trim();

  /** @param {boolean} nextIsOpen */
  function handleOpenChange(nextIsOpen) {
    if (!nextIsOpen) {
      // Cleared on close, not on open: reopening right after a successful
      // reset (e.g. the Admin realizes they need to re-copy it) would
      // otherwise start from a blank field for no reason.
      setPassword('');
      setError('');
      setResetPasswordValue('');
    }
    onOpenChange(nextIsOpen);
  }

  /** @param {import('react').FormEvent<HTMLFormElement>} event */
  async function handleSubmit(event) {
    event.preventDefault();
    setError('');

    if (password.trim().length < MIN_PASSWORD_LENGTH) {
      setError(`Mật khẩu phải có ít nhất ${MIN_PASSWORD_LENGTH} ký tự`);
      return;
    }

    const result = await resetPasswordMutation.mutateAsync(password);

    if (!result.success) {
      setError(result.message);
      return;
    }

    setResetPasswordValue(password);
    setPassword('');
  }

  return (
    <FormDialog
      isOpen={isOpen}
      onOpenChange={handleOpenChange}
      title="Đặt lại mật khẩu"
      subtitle={fullName || undefined}
      submitLabel="Đặt lại mật khẩu"
      width={440}
      draft={password}
      isSubmitting={resetPasswordMutation.isPending}
      isReady={!resetPasswordValue}
      submitError={error}
      onSubmit={handleSubmit}
      successMessage={
        resetPasswordValue
          ? `Đã đặt lại mật khẩu. Mật khẩu mới: ${resetPasswordValue}. Hãy gửi mật khẩu này cho nhân viên — hệ thống không gửi email/SMS.`
          : ''
      }
    >
      {!resetPasswordValue ? (
        <HStack gap={2}>
          <StackItem size="fill">
            <TextInput
              label="Mật khẩu mới"
              value={password}
              onChange={setPassword}
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
              onClick={() => setPassword(generateRandomPassword())}
            />
          </StackItem>
        </HStack>
      ) : null}
    </FormDialog>
  );
}
