'use client';

import { Banner } from '@astryxdesign/core/Banner';
import { Skeleton } from '@astryxdesign/core/Skeleton';
import { Switch } from '@astryxdesign/core/Switch';
import { Text } from '@astryxdesign/core/Text';
import { VStack } from '@astryxdesign/core/VStack';
import { useState } from 'react';

import { labelForPermission } from '../config/grantable-permissions.js';
import { useGrantablePermissionsQuery } from '../hooks/use-grantable-permissions-query.js';
import {
  useGrantUserPermissionMutation,
  useRevokeUserPermissionMutation,
} from '../hooks/use-user-permission-mutation.js';

/**
 * "Quyền" tab — grants/revokes permissions directly on this user,
 * independent of their role/department (see BE-kt-xnk,
 * `openspec/changes/add-user-permission-grants/proposal.md`). Each switch
 * takes effect immediately on toggle, not on the dialog's "Lưu thay đổi":
 * grant/revoke are separate API calls that rotate the target's session the
 * instant they run, so staging them behind the form's save button would
 * misrepresent when the change actually applies.
 * @param {{
 *   userId: string,
 *   extraPermissions: string[],
 *   isLoading: boolean,
 * }} props
 */
export function UserPermissionsFields({ userId, extraPermissions, isLoading }) {
  const [error, setError] = useState('');
  // Which key is mid-flight. A grant/revoke rotates the target's session and
  // is followed by a refetch of the user detail, so the round trip is long
  // enough to be noticed — without this the switch sits on its old value,
  // still clickable, giving no sign the toggle was registered.
  const [pendingKey, setPendingKey] = useState(
    /** @type {string | null} */ (null),
  );
  const grantablePermissionsQuery = useGrantablePermissionsQuery();
  const grantMutation = useGrantUserPermissionMutation(userId);
  const revokeMutation = useRevokeUserPermissionMutation(userId);

  if (isLoading || grantablePermissionsQuery.isLoading) {
    return (
      <VStack gap={3} hAlign="stretch">
        {[0, 1, 2].map((row) => (
          <Skeleton key={row} height={40} index={row} />
        ))}
      </VStack>
    );
  }

  if (grantablePermissionsQuery.isError) {
    return (
      <Banner
        status="error"
        title="Không thể tải danh sách quyền"
        description="Vui lòng tải lại trang để thử lại."
      />
    );
  }

  /**
   * @param {string} permission
   * @param {boolean} nextValue
   */
  async function togglePermission(permission, nextValue) {
    setError('');
    setPendingKey(permission);

    try {
      const result = nextValue
        ? await grantMutation.mutateAsync(permission)
        : await revokeMutation.mutateAsync(permission);

      if (!result.success) {
        setError(result.message);
      }
    } catch {
      // The api layer resolves failures as { success: false }, so the only
      // way here is the post-mutation refetch throwing. The grant/revoke
      // itself already landed; only the re-read of the user failed.
      setError(
        'Đã lưu thay đổi nhưng không tải lại được danh sách quyền. Vui lòng tải lại trang.',
      );
    } finally {
      setPendingKey(null);
    }
  }

  return (
    <VStack gap={4} hAlign="stretch">
      {error ? <Banner status="error" title={error} container="card" /> : null}

      <Text color="secondary">
        Quyền cấp riêng cho người dùng này, không phụ thuộc phòng ban. Bật/tắt
        có hiệu lực ngay, không cần bấm &quot;Lưu thay đổi&quot;. Thay đổi quyền
        sẽ kết thúc các phiên hiện tại; nhân viên cần đăng nhập lại.
      </Text>

      <VStack gap={3} hAlign="stretch">
        {(grantablePermissionsQuery.data ?? []).map(
          ({ key, description: apiDescription }) => {
            const { label, description } = labelForPermission(
              key,
              apiDescription,
            );
            return (
              <Switch
                key={key}
                label={label}
                description={description}
                value={extraPermissions.includes(key)}
                changeAction={(checked) => togglePermission(key, checked)}
                isLoading={pendingKey === key}
                // Serialised on purpose: each toggle rotates the same user's
                // SecurityStamp, so two in flight at once race over one record.
                isDisabled={pendingKey !== null && pendingKey !== key}
                labelSpacing="spread"
              />
            );
          },
        )}
      </VStack>
    </VStack>
  );
}
