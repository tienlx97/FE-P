'use client';

import { Banner } from '@astryxdesign/core/Banner';
import { Button } from '@astryxdesign/core/Button';
import { Heading } from '@astryxdesign/core/Heading';
import { HStack } from '@astryxdesign/core/HStack';
import { Skeleton } from '@astryxdesign/core/Skeleton';
import { StackItem } from '@astryxdesign/core/Stack';
import { proportional, Table } from '@astryxdesign/core/Table';
import { Text } from '@astryxdesign/core/Text';
import { VStack } from '@astryxdesign/core/VStack';
import { useState } from 'react';

import { TextInput } from '@/shared/components/text-input.jsx';

import {
  labelForPermission,
  validatePermissionKey,
} from '../config/grantable-permissions.js';
import { useCreateGrantablePermissionMutation } from '../hooks/use-create-grantable-permission-mutation.js';
import { useGrantablePermissionsQuery } from '../hooks/use-grantable-permissions-query.js';

/**
 * The catalog of permissions that can be granted to an individual user
 * (BE-kt-xnk's `GrantablePermission`). Adding one here only makes it
 * *grantable* — an endpoint still needs its own
 * `[Authorize(Permissions = ...)]` on the backend before the permission
 * actually gates anything, which the copy below says out loud so nobody
 * assumes creating a row here protects a screen.
 *
 * Lives on its own page rather than inside the per-user edit dialog: the
 * catalog is global, and a global action buried in one user's form reads
 * like it only affects that user.
 */
export function PermissionCatalog() {
  const [key, setKey] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const permissionsQuery = useGrantablePermissionsQuery();
  const createMutation = useCreateGrantablePermissionMutation();

  /** @param {import('react').FormEvent<HTMLFormElement>} event */
  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    setSuccess('');

    const keyError = validatePermissionKey(key);
    if (keyError) {
      setError(keyError);
      return;
    }

    const result = await createMutation.mutateAsync({ key, description });

    if (!result.success) {
      setError(result.message);
      return;
    }

    setSuccess(`Đã thêm quyền "${key}".`);
    setKey('');
    setDescription('');
  }

  /** @type {import('@astryxdesign/core/Table').TableColumn<{ key: string, description: string | null } & Record<string, unknown>>[]} */
  const columns = [
    {
      key: 'key',
      header: 'Mã quyền',
      width: proportional(1),
      renderCell: (row) => <Text>{row.key}</Text>,
    },
    {
      key: 'description',
      header: 'Mô tả',
      width: proportional(2),
      renderCell: (row) => {
        const { description: shown } = labelForPermission(
          row.key,
          row.description,
        );
        return <Text color="secondary">{shown ?? '—'}</Text>;
      },
    },
  ];

  const permissions = permissionsQuery.data ?? [];

  return (
    <VStack gap={5} hAlign="stretch">
      <VStack gap={1} hAlign="stretch">
        <Heading level={1}>Quyền cấp riêng</Heading>
        <Text color="secondary">
          Danh mục quyền có thể cấp riêng cho từng nhân viên, độc lập với phòng
          ban. Cấp/thu hồi cho từng người ở tab &quot;Quyền&quot; trong màn hình
          sửa nhân viên.
        </Text>
      </VStack>

      <Banner
        status="info"
        title="Thêm quyền ở đây chưa khoá được màn hình nào"
        description="Quyền mới chỉ có thể cấp cho nhân viên và xuất hiện trong token của họ. Để nó thật sự chặn truy cập, backend cần gắn quyền đó vào endpoint tương ứng."
        container="card"
      />

      {permissionsQuery.isLoading ? (
        <VStack gap={2} hAlign="stretch">
          {[0, 1, 2].map((row) => (
            <Skeleton key={row} height={40} index={row} />
          ))}
        </VStack>
      ) : permissions.length > 0 ? (
        <Table
          data={permissions}
          columns={columns}
          idKey="key"
          dividers="grid"
        />
      ) : (
        <Text color="secondary">Chưa có quyền nào trong danh mục.</Text>
      )}

      <form onSubmit={handleSubmit}>
        <VStack gap={3} hAlign="stretch">
          <Heading level={2}>Thêm quyền mới</Heading>

          {error ? (
            <Banner status="error" title={error} container="card" />
          ) : null}
          {success ? (
            <Banner status="success" title={success} container="card" />
          ) : null}

          <HStack gap={3} vAlign="end">
            <StackItem size="fill">
              <TextInput
                label="Mã quyền"
                description="Dạng nhom:hanh-dong, chữ thường không dấu — vd: sales:secret"
                placeholder="sales:secret"
                value={key}
                onChange={setKey}
                isRequired
              />
            </StackItem>
            <StackItem size="fill">
              <TextInput
                label="Mô tả"
                description="Không bắt buộc — hiển thị kèm quyền khi cấp cho nhân viên"
                value={description}
                onChange={setDescription}
              />
            </StackItem>
            <Button
              label="Thêm"
              type="submit"
              variant="primary"
              isLoading={createMutation.isPending}
            />
          </HStack>
        </VStack>
      </form>
    </VStack>
  );
}
