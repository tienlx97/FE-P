'use client';

import { Text } from '@astryxdesign/core/Text';
import { VStack } from '@astryxdesign/core/VStack';
import { ArchiveRestore } from 'lucide-react';
import { useRef, useState } from 'react';

import { MetaFormSection } from '@/shared/components/custom/meta/index.js';
import { MetaFormDrawer } from '@/shared/components/meta-form-drawer.jsx';
import { TextInput } from '@/shared/components/text-input.jsx';

import { useRestoreBackupMutation } from '../hooks/use-restore-backup-mutation.js';

// Must match the backend's live database name exactly — the API rejects the
// restore otherwise (Backup.ConfirmationMismatch). Typing it out is the
// confirmation step for an action that is destructive and irreversible from
// inside the app.
const CONFIRM_DATABASE_NAME = 'CompanyManagement';

// How often to silently re-check while the backend reports the restore as
// still running (409) rather than making the Admin reload the page by hand
// to find out.
const POLL_INTERVAL_MS = 5000;

/**
 * @param {{
 *   onOpenChange: (isOpen: boolean) => void,
 *   backup: import('../types/index.js').BackupFile,
 * }} props
 */
export function RestoreBackupDrawer({ onOpenChange, backup }) {
  const [confirmText, setConfirmText] = useState('');
  const [error, setError] = useState('');
  const [didSucceed, setDidSucceed] = useState(false);
  const [isPolling, setIsPolling] = useState(false);

  const restoreMutation = useRestoreBackupMutation(backup.fileName);
  // Stops a scheduled retry from firing into a closed drawer's state.
  const isCancelledRef = useRef(false);

  /** @param {boolean} nextIsOpen */
  function handleOpenChange(nextIsOpen) {
    if (!nextIsOpen) {
      isCancelledRef.current = true;
      setConfirmText('');
      setError('');
      setDidSucceed(false);
      setIsPolling(false);
    }
    onOpenChange(nextIsOpen);
  }

  /** @param {string} confirmDatabaseName */
  async function attemptRestore(confirmDatabaseName) {
    const result = await restoreMutation.mutateAsync(confirmDatabaseName);

    if (isCancelledRef.current) return;

    if (result.success) {
      setIsPolling(false);
      setDidSucceed(true);
      // Every cached query result across the app is now stale — a reload
      // is simpler and safer than trying to selectively invalidate
      // everything.
      window.setTimeout(() => window.location.reload(), 2000);
      return;
    }

    // 409 covers two backend cases, both worth retrying silently rather
    // than surfacing as an error: the restore is still running past the
    // backend's own response timeout, or (on an earlier retry landing
    // while it's still going) it's already in progress. Anything else
    // (wrong confirmation text, backup missing) is final.
    if (result.status === 409) {
      setIsPolling(true);
      window.setTimeout(() => {
        if (!isCancelledRef.current) attemptRestore(confirmDatabaseName);
      }, POLL_INTERVAL_MS);
      return;
    }

    setIsPolling(false);
    setError(result.message);
  }

  /** @param {import('react').FormEvent<HTMLFormElement>} event */
  async function handleSubmit(event) {
    event.preventDefault();
    setError('');

    if (confirmText !== CONFIRM_DATABASE_NAME) {
      setError(`Vui lòng gõ đúng "${CONFIRM_DATABASE_NAME}" để xác nhận`);
      return;
    }

    await attemptRestore(confirmText);
  }

  return (
    <MetaFormDrawer
      onClose={() => handleOpenChange(false)}
      icon={ArchiveRestore}
      title="Khôi phục bản sao lưu"
      meta={
        <Text size="sm" color="accent">
          {backup.fileName}
        </Text>
      }
      submitLabel="Khôi phục"
      width={600}
      draft=""
      showDirtyHint={false}
      isSubmitting={restoreMutation.isPending || isPolling}
      isSubmitDisabled={didSucceed || isPolling}
      submitError={error}
      onSubmit={handleSubmit}
    >
      {didSucceed || isPolling ? (
        <Text color="secondary">
          {didSucceed
            ? 'Khôi phục thành công. Trang sẽ tự tải lại...'
            : 'Vẫn đang khôi phục ở máy chủ — không tắt trình duyệt, trang sẽ tự kiểm tra lại...'}
        </Text>
      ) : null}
      {!didSucceed ? (
        <MetaFormSection
          title="Xác nhận khôi phục"
          isTitleUppercase={false}
          isBoxed
        >
          <VStack gap={3} hAlign="stretch">
            <Text color="secondary">
              Toàn bộ dữ liệu hiện tại sẽ bị <strong>ghi đè</strong> bằng dữ
              liệu trong bản sao lưu này. Thao tác không thể hoàn tác. Hệ thống
              sẽ tự tạo một bản sao lưu của dữ liệu hiện tại trước khi ghi đè,
              phòng trường hợp cần quay lại.
            </Text>
            <Text color="secondary">
              Có thể mất khoảng 1 phút — quá trình không bị ngắt giữa chừng dù
              trang có báo &quot;quá thời gian&quot;, trang sẽ tự kiểm tra lại
              cho tới khi xong.
            </Text>
            <TextInput
              label={`Gõ "${CONFIRM_DATABASE_NAME}" để xác nhận`}
              value={confirmText}
              onChange={setConfirmText}
              placeholder={CONFIRM_DATABASE_NAME}
              isRequired
              isDisabled={isPolling}
            />
          </VStack>
        </MetaFormSection>
      ) : null}
    </MetaFormDrawer>
  );
}
