'use client';

import { FileInput } from '@astryxdesign/core/FileInput';
import { Text } from '@astryxdesign/core/Text';
import { VStack } from '@astryxdesign/core/VStack';
import { useState } from 'react';

import { FormDialog } from '@/shared/components/form-dialog.jsx';

import { useUploadBackupMutation } from '../hooks/use-upload-backup-mutation.js';

/**
 * @param {{
 *   isOpen: boolean,
 *   onOpenChange: (isOpen: boolean) => void,
 * }} props
 */
export function UploadBackupDialog({ isOpen, onOpenChange }) {
  const [file, setFile] = useState(/** @type {File | null} */ (null));
  const [error, setError] = useState('');
  const [didSucceed, setDidSucceed] = useState(false);

  const uploadMutation = useUploadBackupMutation();

  /** @param {boolean} nextIsOpen */
  function handleOpenChange(nextIsOpen) {
    if (!nextIsOpen) {
      setFile(null);
      setError('');
      setDidSucceed(false);
    }
    onOpenChange(nextIsOpen);
  }

  /** @param {import('react').FormEvent<HTMLFormElement>} event */
  async function handleSubmit(event) {
    event.preventDefault();
    setError('');

    if (!file) {
      setError('Vui lòng chọn file .sql để tải lên');
      return;
    }

    if (!file.name.toLowerCase().endsWith('.sql')) {
      setError('Chỉ chấp nhận file .sql');
      return;
    }

    const result = await uploadMutation.mutateAsync(file);

    if (!result.success) {
      setError(result.message);
      return;
    }

    setDidSucceed(true);
  }

  return (
    <FormDialog
      isOpen={isOpen}
      onOpenChange={handleOpenChange}
      title="Tải lên bản sao lưu"
      submitLabel="Tải lên"
      width={480}
      draft={file?.name ?? ''}
      isSubmitting={uploadMutation.isPending}
      isReady={!didSucceed}
      submitError={error}
      onSubmit={handleSubmit}
      successMessage={
        didSucceed
          ? 'Tải lên thành công. File đã xuất hiện trong danh sách bên dưới, có thể khôi phục như bình thường.'
          : ''
      }
    >
      {!didSucceed ? (
        <VStack gap={3} hAlign="stretch">
          <Text color="secondary">
            Chọn một file <strong>.sql</strong> (ví dụ: bản sao lưu đã tải về
            từ máy khác) để lưu vào server. Thao tác này chỉ lưu file — chưa
            khôi phục dữ liệu; sau khi tải lên xong, bấm &quot;Khôi phục&quot;
            trên file vừa tải lên nếu muốn ghi đè dữ liệu hiện tại.
          </Text>
          <FileInput
            label="File backup (.sql)"
            value={file}
            onChange={setFile}
            accept=".sql"
            isRequired
          />
        </VStack>
      ) : null}
    </FormDialog>
  );
}
