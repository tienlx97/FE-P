'use client';

import { Text } from '@astryxdesign/core/Text';
import { TextInput } from '@astryxdesign/core/TextInput';
import { VStack } from '@astryxdesign/core/VStack';
import { useState } from 'react';

import { FormDialog } from '@/shared/components/form-dialog.jsx';

import { useRestoreBackupMutation } from '../hooks/use-restore-backup-mutation.js';

// Must match the backend's live database name exactly — the API rejects the
// restore otherwise (Backup.ConfirmationMismatch). Typing it out is the
// confirmation step for an action that is destructive and irreversible from
// inside the app.
const CONFIRM_DATABASE_NAME = 'CompanyManagement';

/**
 * @param {{
 *   isOpen: boolean,
 *   onOpenChange: (isOpen: boolean) => void,
 *   backup: import('../types/index.js').BackupFile,
 * }} props
 */
export function RestoreBackupDialog({ isOpen, onOpenChange, backup }) {
  const [confirmText, setConfirmText] = useState('');
  const [error, setError] = useState('');
  const [didSucceed, setDidSucceed] = useState(false);

  const restoreMutation = useRestoreBackupMutation(backup.fileName);

  /** @param {boolean} nextIsOpen */
  function handleOpenChange(nextIsOpen) {
    if (!nextIsOpen) {
      setConfirmText('');
      setError('');
      setDidSucceed(false);
    }
    onOpenChange(nextIsOpen);
  }

  /** @param {import('react').FormEvent<HTMLFormElement>} event */
  async function handleSubmit(event) {
    event.preventDefault();
    setError('');

    if (confirmText !== CONFIRM_DATABASE_NAME) {
      setError(`Vui lòng gõ đúng "${CONFIRM_DATABASE_NAME}" để xác nhận`);
      return;
    }

    const result = await restoreMutation.mutateAsync(confirmText);

    if (!result.success) {
      setError(result.message);
      return;
    }

    setDidSucceed(true);
    // Every cached query result across the app is now stale — a reload is
    // simpler and safer than trying to selectively invalidate everything.
    window.setTimeout(() => window.location.reload(), 2000);
  }

  return (
    <FormDialog
      isOpen={isOpen}
      onOpenChange={handleOpenChange}
      title="Khôi phục bản sao lưu"
      subtitle={backup.fileName}
      submitLabel="Khôi phục"
      width={480}
      draft={confirmText}
      isSubmitting={restoreMutation.isPending}
      isReady={!didSucceed}
      submitError={error}
      onSubmit={handleSubmit}
      successMessage={
        didSucceed
          ? 'Khôi phục thành công. Trang sẽ tự tải lại...'
          : ''
      }
    >
      {!didSucceed ? (
        <VStack gap={3} hAlign="stretch">
          <Text color="secondary">
            Toàn bộ dữ liệu hiện tại sẽ bị <strong>ghi đè</strong> bằng dữ
            liệu trong bản sao lưu này. Thao tác không thể hoàn tác. Nên tạo
            một bản sao lưu mới của dữ liệu hiện tại trước khi tiếp tục, phòng
            trường hợp cần quay lại.
          </Text>
          <Text color="secondary">
            Có thể mất khoảng 1 phút — nếu trang báo &quot;quá thời gian&quot;, quá
            trình vẫn tiếp tục chạy ở máy chủ, không bị ngắt giữa chừng; đợi
            một lát rồi tải lại trang.
          </Text>
          <TextInput
            label={`Gõ "${CONFIRM_DATABASE_NAME}" để xác nhận`}
            value={confirmText}
            onChange={setConfirmText}
            placeholder={CONFIRM_DATABASE_NAME}
            isRequired
          />
        </VStack>
      ) : null}
    </FormDialog>
  );
}
