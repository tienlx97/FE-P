'use client';

import { Text } from '@astryxdesign/core/Text';
import { VStack } from '@astryxdesign/core/VStack';
import { ArchiveRestore } from 'lucide-react';
import { useRef, useState } from 'react';

import { MetaFormSection } from '@/shared/components/custom/meta/index.js';
import { MetaFormDrawer } from '@/shared/components/meta-form-drawer.jsx';
import { TextInput } from '@/shared/components/text-input.jsx';

import { getRestoreStatus } from '../api/backups.js';
import { RESTORE_POLL_INTERVAL_MS, restoreOutcome } from '../config/restore-status.js';
import { useRestoreBackupMutation } from '../hooks/use-restore-backup-mutation.js';

// Must match the backend's live database name exactly — the API rejects the
// restore otherwise (Backup.ConfirmationMismatch). Typing it out is the
// confirmation step for an action that is destructive and irreversible from
// inside the app.
const CONFIRM_DATABASE_NAME = 'CompanyManagement';

/** Time to read the success message before the page reloads. */
const RELOAD_DELAY_MS = 4000;

/**
 * Starts a restore (the API runs it in the background and answers at once)
 * and follows it through `restore-status` until it ends — never by sending
 * the restore again. The status is readable without a session: restoring a
 * backup from another machine replaces the users, so after a success the
 * reload may land on `/login` — sign in with an account from that backup.
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
  // Stops a scheduled status check from firing into a closed drawer's state.
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

  /** @param {string} restoreId */
  function scheduleCheck(restoreId) {
    window.setTimeout(async () => {
      if (isCancelledRef.current) return;
      const result = await getRestoreStatus();
      if (isCancelledRef.current) return;

      // A failed read (network blip, API restarting) is not the restore
      // failing: keep checking.
      const outcome = restoreOutcome(result.success ? result.status : null, restoreId);
      if (outcome === 'running') {
        scheduleCheck(restoreId);
        return;
      }

      setIsPolling(false);
      if (outcome === 'succeeded') {
        setDidSucceed(true);
        // Every cached query result across the app is now stale — a reload
        // is simpler and safer than trying to selectively invalidate
        // everything.
        window.setTimeout(() => window.location.reload(), RELOAD_DELAY_MS);
        return;
      }

      setError((result.success && result.status.message) || 'Khôi phục thất bại — xem log máy chủ.');
    }, RESTORE_POLL_INTERVAL_MS);
  }

  /** @param {import('react').FormEvent<HTMLFormElement>} event */
  async function handleSubmit(event) {
    event.preventDefault();
    setError('');

    if (confirmText !== CONFIRM_DATABASE_NAME) {
      setError(`Vui lòng gõ đúng "${CONFIRM_DATABASE_NAME}" để xác nhận`);
      return;
    }

    isCancelledRef.current = false;
    const result = await restoreMutation.mutateAsync(confirmText);
    if (isCancelledRef.current) return;

    if (!result.success || !result.status.restoreId) {
      setError(result.success ? 'Máy chủ không trả mã khôi phục.' : result.message);
      return;
    }

    setIsPolling(true);
    scheduleCheck(result.status.restoreId);
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
        <VStack gap={2} hAlign="stretch">
          <Text color="secondary">
            {didSucceed
              ? 'Khôi phục thành công. Trang sẽ tự tải lại...'
              : 'Đang khôi phục ở máy chủ (sao lưu an toàn, rồi ghi đè dữ liệu) — không cần giữ trang, quá trình không bị ngắt; trang tự kiểm tra kết quả...'}
          </Text>
          {didSucceed ? (
            <Text color="secondary">
              Nếu bản sao lưu lấy từ máy khác, danh sách người dùng giờ là của máy đó: khi được đưa về trang đăng
              nhập, hãy đăng nhập bằng tài khoản có trong bản sao lưu.
            </Text>
          ) : null}
        </VStack>
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
              Có thể mất vài phút với dữ liệu lớn — máy chủ khôi phục ở nền và
              trang sẽ báo kết quả khi xong.
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
