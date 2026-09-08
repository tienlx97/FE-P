'use client';

import { Badge } from '@astryxdesign/core/Badge';
import { Banner } from '@astryxdesign/core/Banner';
import { Button } from '@astryxdesign/core/Button';
import { HStack } from '@astryxdesign/core/HStack';
import { Icon } from '@astryxdesign/core/Icon';
import { pixel, proportional } from '@astryxdesign/core/Table';
import { Heading, Text } from '@astryxdesign/core/Text';
import { VStack } from '@astryxdesign/core/VStack';
import { useState } from 'react';

import {
  AdvanceTable,
  AdvanceTableErrorBanner,
} from '@/shared/components/advance-table.jsx';
import { IconPlus } from '@/shared/components/icon/icon-plus.jsx';
import { IconUpload } from '@/shared/components/icon/icon-upload.jsx';

import { downloadBackupUrl } from '../api/backups.js';
import { useBackupsQuery } from '../hooks/use-backups-query.js';
import { useCreateBackupMutation } from '../hooks/use-create-backup-mutation.js';
import { RestoreBackupDialog } from './restore-backup-dialog.jsx';
import { UploadBackupDialog } from './upload-backup-dialog.jsx';

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

// The backend has no "source" field on a backup, but the nightly cron and
// manual uploads write distinguishable file-name prefixes
// (`companymanagement-...` vs `uploaded-...` — see backups.js /
// README.LAN.md), so the badge is derived rather than stored.
const UPLOADED_FILE_PREFIX = 'uploaded-';

const COLUMN_OPTIONS = [
  { key: 'fileName', label: 'Tên file', isAlwaysVisible: true },
  { key: 'createdAtUtc', label: 'Thời gian tạo' },
  { key: 'sizeBytes', label: 'Kích thước' },
  { key: 'actions', label: 'Thao tác', isAlwaysVisible: true },
];
const ALL_COLUMN_KEYS = COLUMN_OPTIONS.map((column) => column.key);

const SEARCH_FIELD_DEFS = [
  { key: 'fileName', type: 'string', label: 'Tên file' },
];

const SKELETON_ROW_COUNT = 4;
/** @type {import('../types/index.js').BackupFile[]} */
const skeletonRows = Array.from({ length: SKELETON_ROW_COUNT }, (_, index) => ({
  fileName: `skeleton-${index}`,
  sizeBytes: 0,
  createdAtUtc: new Date().toISOString(),
}));

export function BackupList() {
  const backupsQuery = useBackupsQuery();
  const createBackupMutation = useCreateBackupMutation();
  const [restoringBackup, setRestoringBackup] = useState(
    /** @type {import('../types/index.js').BackupFile | null} */ (null),
  );
  const [isUploadOpen, setIsUploadOpen] = useState(false);

  const listResult = backupsQuery.data;
  const backups = listResult?.success ? listResult.backups : [];

  // The API returns backups newest-first — the first row is the one a
  // restore/rollback would most likely reach for, so it's worth calling out.
  const rows = backups.map((backup, index) => ({
    ...backup,
    isNewest: index === 0,
    isUploaded: backup.fileName.startsWith(UPLOADED_FILE_PREFIX),
  }));

  /** @type {import('@astryxdesign/core/Table').TableColumn<typeof rows[number] & Record<string, unknown>>[]} */
  const columns = [
    {
      key: 'fileName',
      header: 'Tên file',
      width: proportional(2.2),
      filter: 'fileName',
      renderCell: (backup) => (
        <HStack gap={2} vAlign="center" wrap="wrap">
          <Text weight="medium">{backup.fileName}</Text>
          {backup.isNewest ? <Badge variant="success" label="Mới nhất" /> : null}
          {backup.isUploaded ? (
            <Badge variant="neutral" label="Tải lên thủ công" />
          ) : null}
        </HStack>
      ),
    },
    {
      key: 'createdAtUtc',
      header: 'Thời gian tạo',
      width: proportional(1.3),
      renderCell: (backup) => formatDate(backup.createdAtUtc),
    },
    {
      key: 'sizeBytes',
      header: 'Kích thước',
      width: proportional(1),
      renderCell: (backup) =>
        backup.sizeBytes === 0 ? (
          <HStack gap={2} vAlign="center">
            <Text>0 B</Text>
            <Badge variant="warning" label="Có thể lỗi" />
          </HStack>
        ) : (
          formatSize(backup.sizeBytes)
        ),
    },
    {
      key: 'actions',
      header: 'Thao tác',
      width: pixel(200),
      align: 'end',
      renderCell: (backup) => (
        <HStack gap={2} vAlign="center">
          <Button
            label="Tải xuống"
            variant="ghost"
            size="sm"
            href={downloadBackupUrl(backup.fileName)}
          />
          <Button
            label="Khôi phục"
            variant="destructive"
            size="sm"
            onClick={() => setRestoringBackup(backup)}
          />
        </HStack>
      ),
    },
  ];

  return (
    <VStack gap={4} hAlign="stretch">
      <HStack hAlign="between" vAlign="center" wrap="wrap" gap={3}>
        <VStack gap={1}>
          <Heading level={1}>Sao lưu &amp; khôi phục dữ liệu</Heading>
          <Text color="secondary">
            Bản sao lưu logic của toàn bộ cơ sở dữ liệu (`mysqldump`) — cùng
            định dạng file mà cron sao lưu hàng đêm và thao tác khôi phục thủ
            công dùng (xem README.LAN.md).
          </Text>
        </VStack>
        <HStack gap={2}>
          <Button
            label="Tải lên bản sao lưu"
            variant="secondary"
            icon={<Icon icon={IconUpload} size="sm" />}
            onClick={() => setIsUploadOpen(true)}
          />
          <Button
            label="Tạo bản sao lưu mới"
            variant="primary"
            icon={<Icon icon={IconPlus} size="sm" />}
            isLoading={createBackupMutation.isPending}
            onClick={() => createBackupMutation.mutate()}
          />
        </HStack>
      </HStack>

      {listResult && !listResult.success ? (
        <AdvanceTableErrorBanner message={listResult.message} />
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

      <AdvanceTable
        toolbarLabel="Thao tác danh sách bản sao lưu"
        searchFieldDefs={SEARCH_FIELD_DEFS}
        entityLabel="Bản sao lưu"
        contentSearchFieldKey="fileName"
        searchPlaceholder="Tìm theo tên file..."
        columnOptions={COLUMN_OPTIONS}
        initialColumnKeys={ALL_COLUMN_KEYS}
        defaultColumnKeys={ALL_COLUMN_KEYS}
        tableColumns={columns}
        data={rows}
        idKey="fileName"
        isLoading={backupsQuery.isLoading}
        skeletonRows={skeletonRows}
        onRefresh={() => backupsQuery.refetch()}
        isRefreshing={backupsQuery.isFetching}
      />

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

      <UploadBackupDialog
        isOpen={isUploadOpen}
        onOpenChange={setIsUploadOpen}
      />
    </VStack>
  );
}
