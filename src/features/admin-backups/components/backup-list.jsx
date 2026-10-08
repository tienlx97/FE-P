'use client';

import { Banner } from '@astryxdesign/core/Banner';
import { Button } from '@astryxdesign/core/Button';
import { ButtonGroup } from '@astryxdesign/core/ButtonGroup';
import { HStack } from '@astryxdesign/core/HStack';
import { Icon } from '@astryxdesign/core/Icon';
import { StackItem } from '@astryxdesign/core/Stack';
import { pixel, proportional } from '@astryxdesign/core/Table';
import { Text } from '@astryxdesign/core/Text';
import { VStack } from '@astryxdesign/core/VStack';
import * as stylex from '@stylexjs/stylex';
import { DatabaseBackup, Download } from 'lucide-react';
import { useState } from 'react';

import {
  AdvanceTable,
  AdvanceTableErrorBanner,
} from '@/shared/components/advance-table.jsx';
import {
  MetaListTitle,
  MetaPageHeader,
  MetaPrimaryCell,
  MetaStatusBadge,
  MetaThemeProvider,
} from '@/shared/components/custom/meta/index.js';
import { IconPlus } from '@/shared/components/icon/icon-plus.jsx';
import { IconUpload } from '@/shared/components/icon/icon-upload.jsx';

import { downloadBackupUrl } from '../api/backups.js';
import { useBackupsQuery } from '../hooks/use-backups-query.js';
import { useCreateBackupMutation } from '../hooks/use-create-backup-mutation.js';
import { ExportPublicDataDrawer } from './export-public-data-drawer.jsx';
import { ImportPublicDataDrawer } from './import-public-data-drawer.jsx';
import { OperationsStatus } from './operations-status.jsx';
import { RestoreBackupDrawer } from './restore-backup-drawer.jsx';
import { UploadBackupDrawer } from './upload-backup-drawer.jsx';

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

/** @satisfies {ReadonlyArray<import('@astryxdesign/core/PowerSearch').FieldDefinition>} */
const SEARCH_FIELD_DEFS = [
  { key: 'fileName', type: 'string', label: 'Tên file' },
];

const SKELETON_ROW_COUNT = 4;
/** @type {(import('../types/index.js').BackupFile & {isNewest: boolean, isUploaded: boolean})[]} */
const skeletonRows = Array.from({ length: SKELETON_ROW_COUNT }, (_, index) => ({
  fileName: `skeleton-${index}`,
  sizeBytes: 0,
  isNewest: false,
  isUploaded: false,
  createdAtUtc: new Date().toISOString(),
}));

export function BackupList() {
  const backupsQuery = useBackupsQuery();
  const createBackupMutation = useCreateBackupMutation();
  const [restoringBackup, setRestoringBackup] = useState(
    /** @type {import('../types/index.js').BackupFile | null} */ (null),
  );
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isPublicImportOpen, setIsPublicImportOpen] = useState(false);
  const [isPublicExportOpen, setIsPublicExportOpen] = useState(false);

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
          <MetaPrimaryCell>{backup.fileName}</MetaPrimaryCell>
          {backup.isNewest ? (
            <MetaStatusBadge tone="success" label="Mới nhất" />
          ) : null}
          {backup.isUploaded ? (
            <MetaStatusBadge label="Tải lên thủ công" />
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
            <Text color="secondary">Cần kiểm tra</Text>
          </HStack>
        ) : (
          formatSize(backup.sizeBytes)
        ),
    },
    {
      key: 'actions',
      header: 'Thao tác',
      width: pixel(240),
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
            xstyle={styles.restoreButton}
            onClick={() => setRestoringBackup(backup)}
          />
        </HStack>
      ),
    },
  ];

  return (
    <MetaThemeProvider>
      <VStack gap={5} hAlign="stretch" height="100%">
        <MetaPageHeader
          trail={[
            { label: 'Quản trị', href: '/admin' },
            { label: 'Sao lưu & khôi phục' },
          ]}
          icon={DatabaseBackup}
          title="Sao lưu & khôi phục dữ liệu"
          description="Theo dõi bản sao, tạo bản mới và khôi phục dữ liệu khi cần."
        />
        <HStack hAlign="between" vAlign="center" wrap="wrap" gap={3}>
          <MetaListTitle
            title="Danh sách bản sao lưu"
            count={backups.length}
            unit="bản"
          />
          <HStack gap={2} wrap="wrap">
            <ButtonGroup label="Chuyển dữ liệu public">
              <Button
                label="Xuất dữ liệu public"
                variant="secondary"
                icon={<Icon icon={Download} size="sm" />}
                onClick={() => setIsPublicExportOpen(true)}
              />
              <Button
                label="Nhập dữ liệu public"
                variant="secondary"
                icon={<Icon icon={IconUpload} size="sm" />}
                onClick={() => setIsPublicImportOpen(true)}
              />
            </ButtonGroup>
            <ButtonGroup label="Tạo và tải bản sao lưu">
              <Button
                label="Tải lên bản sao lưu"
                variant="primary"
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
            </ButtonGroup>
          </HStack>
        </HStack>

        <OperationsStatus />

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

        <StackItem size="fill">
          <AdvanceTable
            isFramed
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
        </StackItem>

        {restoringBackup ? (
          <RestoreBackupDrawer
            key={restoringBackup.fileName}
            onOpenChange={(isOpen) => {
              if (!isOpen) setRestoringBackup(null);
            }}
            backup={restoringBackup}
          />
        ) : null}

        {isUploadOpen ? (
          <UploadBackupDrawer onOpenChange={setIsUploadOpen} />
        ) : null}
        {isPublicImportOpen ? (
          <ImportPublicDataDrawer onOpenChange={setIsPublicImportOpen} />
        ) : null}
        {isPublicExportOpen ? (
          <ExportPublicDataDrawer onOpenChange={setIsPublicExportOpen} />
        ) : null}
      </VStack>
    </MetaThemeProvider>
  );
}

const styles = stylex.create({
  restoreButton: {
    marginRight: 'var(--spacing-2)',
  },
});
