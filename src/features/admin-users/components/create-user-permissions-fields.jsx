'use client';

import { Banner } from '@astryxdesign/core/Banner';
import { CheckboxInput } from '@astryxdesign/core/CheckboxInput';
import {
  CheckboxList,
  CheckboxListItem,
} from '@astryxdesign/core/CheckboxList';
import { Skeleton } from '@astryxdesign/core/Skeleton';
import { Text } from '@astryxdesign/core/Text';
import { VStack } from '@astryxdesign/core/VStack';

import {
  labelForPermission,
  labelForPermissionScope,
} from '../config/grantable-permissions.js';

/**
 * @param {{
 *   inheritedPermissions: import('../types/index.js').InheritedPermission[],
 *   grantablePermissions: import('../types/index.js').GrantablePermission[],
 *   selectedPermissions: string[],
 *   isLoading: boolean,
 *   error?: string,
 *   hasDepartment: boolean,
 *   onChange: (permissions: string[]) => void,
 * }} props
 */
export function CreateUserPermissionsFields({
  inheritedPermissions,
  grantablePermissions,
  selectedPermissions,
  isLoading,
  error,
  hasDepartment,
  onChange,
}) {
  if (!hasDepartment) {
    return (
      <Text color="secondary">
        Chọn phòng ban để xem quyền kế thừa và cấp thêm quyền cho nhân viên.
      </Text>
    );
  }

  if (isLoading) {
    return (
      <VStack gap={3} hAlign="stretch">
        {[0, 1, 2].map((row) => (
          <Skeleton key={row} height={40} index={row} />
        ))}
      </VStack>
    );
  }

  if (error) return <Banner status="error" title={error} />;

  return (
    <VStack gap={5} hAlign="stretch">
      <VStack gap={3} hAlign="stretch">
        <Text type="large" weight="semibold">
          Quyền kế thừa từ phòng ban
        </Text>
        {inheritedPermissions.length > 0 ? (
          inheritedPermissions.map((permission) => (
            <CheckboxInput
              key={`${permission.key}-${permission.scopeId}`}
              label={
                labelForPermission(permission.key, permission.description).label
              }
              description={`${permission.description} · ${labelForPermissionScope(permission.scopeType)}`}
              value
              isReadOnly
              width="100%"
            />
          ))
        ) : (
          <Text color="secondary">Phòng ban này không cấp quyền kế thừa.</Text>
        )}
      </VStack>

      <Text color="secondary">
        Quyền Admin được cấp riêng cho tài khoản, không phụ thuộc tên phòng ban.
        Tạo nhân viên không đăng nhập thay họ; nhân viên sử dụng CCCD và mật
        khẩu để đăng nhập.
      </Text>

      <CheckboxList
        label="Quyền cấp thêm"
        description="Không bắt buộc. Các quyền đã chọn sẽ được lưu cùng lúc khi tạo nhân viên."
        value={selectedPermissions}
        onChange={onChange}
        hasDividers
        width="100%"
      >
        {grantablePermissions.map(({ key, description }) => {
          const display = labelForPermission(key, description);
          return (
            <CheckboxListItem
              key={key}
              value={key}
              label={display.label}
              description={display.description}
            />
          );
        })}
      </CheckboxList>
    </VStack>
  );
}
