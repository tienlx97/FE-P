'use client';

import { Banner } from '@astryxdesign/core/Banner';
import { Button } from '@astryxdesign/core/Button';
import { Card } from '@astryxdesign/core/Card';
import { EmptyState } from '@astryxdesign/core/EmptyState';
import { HStack } from '@astryxdesign/core/HStack';
import { Heading, Text } from '@astryxdesign/core/Text';
import { VStack } from '@astryxdesign/core/VStack';
import { useState } from 'react';

import { downloadBackupUrl } from '../api/backups.js';
import { useBackupsQuery } from '../hooks/use-backups-query.js';
import { useCreateBackupMutation } from '../hooks/use-create-backup-mutation.js';
import { RestoreBackupDialog } from './restore-backup-dialog.jsx';

const BYTES_IN_KB = 1024;

/** @param {number} sizeBytes */
function formatSize(sizeBytes) {
  if (sizeBytes < BYTES_IN_KB) return `${sizeBytes} B`;
  const kb = sizeBytes / BYTES_IN_KB;
  if (kb < BYTES_IN_KB) return `${kb.toFixed(1)} KB`;
  return `${(kb / BYTES_IN_KB).toFixed(1)} MB`;
}

/** @param {string} isoDateUtc */
function formatDate(isoDateUtc) {
  return new Date(isoDateUtc).toLocaleString('vi-VN');
}

export function BackupList() {
  const backupsQuery = useBackupsQuery();
  const createBackupMutation = useCreateBackupMutation();
  const [restoringBackup, setRestoringBackup] = useState(
    /** @type {import('../types/index.js').BackupFile | null} */ (null),
  );

  const listResult = backupsQuery.data;
  const backups = listResult?.success ? listResult.backups : [];

  return (
    <VStack gap={4} hAlign="stretch">
      <HStack hAlign="between" vAlign="center">
        <VStack gap={1}>
          <Heading level={1}>Sao lưu &amp; khôi phục dữ liệu</Heading>
          <Text color="secondary">
            Bản sao lưu logic của toàn bộ cơ sở dữ liệu (`mysqldump`) — cùng
            định dạng file mà cron sao lưu hàng đêm và thao tác khôi phục thủ
            công dùng (xem README.LAN.md).
          </Text>
        </VStack>
        <Button
          label="Tạo bản sao lưu mới"
          variant="primary"
          isLoading={createBackupMutation.isPending}
          onClick={() => createBackupMutation.mutate()}
        />
      </HStack>

      {listResult && !listResult.success ? (
        <Banner status="error" title={listResult.message} container="card" />
      ) : null}

      {createBackupMutation.isError ||
      (createBackupMutation.data && !createBackupMutation.data.success) ? (
        <Banner
          status="error"
          title={
            createBackupMutation.data && !createBackupMutation.data.success
              ? createBackupMutation.data.message
              : 'Không thể tạo bản sao lưu'
          }
          container="card"
        />
      ) : null}

      {backupsQuery.isLoading ? (
        <Text color="secondary">Đang tải...</Text>
      ) : backups.length === 0 ? (
        <EmptyState
          title="Chưa có bản sao lưu nào"
          description='Bấm "Tạo bản sao lưu mới" để tạo bản đầu tiên.'
        />
      ) : (
        <VStack gap={2} hAlign="stretch">
          {backups.map((backup) => (
            <Card key={backup.fileName} padding={4}>
              <HStack hAlign="between" vAlign="center">
                <VStack gap={1}>
                  <Text weight="medium">{backup.fileName}</Text>
                  <Text color="secondary" size="sm">
                    {formatDate(backup.createdAtUtc)} ·{' '}
                    {formatSize(backup.sizeBytes)}
                  </Text>
                </VStack>
                <HStack gap={2}>
                  <Button
                    label="Tải xuống"
                    variant="secondary"
                    href={downloadBackupUrl(backup.fileName)}
                  />
                  <Button
                    label="Khôi phục"
                    variant="destructive"
                    onClick={() => setRestoringBackup(backup)}
                  />
                </HStack>
              </HStack>
            </Card>
          ))}
        </VStack>
      )}

      {restoringBackup ? (
        <RestoreBackupDialog
          key={restoringBackup.fileName}
          isOpen={restoringBackup !== null}
          onOpenChange={(isOpen) => {
            if (!isOpen) setRestoringBackup(null);
          }}
          backup={restoringBackup}
        />
      ) : null}
    </VStack>
  );
}
