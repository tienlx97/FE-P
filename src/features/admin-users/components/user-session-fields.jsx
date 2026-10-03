'use client';

import { Switch } from '@astryxdesign/core/Switch';

/**
 * @param {{
 *   allowed: boolean,
 *   isUpdating: boolean,
 *   status?: { type: 'error' | 'success', message: string },
 *   onChange: (allowed: boolean) => void,
 * }} props
 */
export function UserSessionFields({ allowed, isUpdating, status, onChange }) {
  return (
    <Switch
      label="Cho phép đăng nhập trên nhiều thiết bị"
      description="Khi bật, các thiết bị có phiên độc lập; đăng xuất một thiết bị không ảnh hưởng thiết bị khác. Khi tắt, tất cả phiên hiện tại kết thúc ngay và người dùng phải đăng nhập lại."
      value={allowed}
      onChange={onChange}
      isLoading={isUpdating}
      isDisabled={isUpdating}
      disabledMessage="Đang cập nhật cài đặt phiên đăng nhập"
      status={status}
      labelPosition="start"
      labelSpacing="spread"
      width="100%"
    />
  );
}
