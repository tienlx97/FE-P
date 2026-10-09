'use client';

import { Divider } from '@astryxdesign/core/Divider';
import { Icon } from '@astryxdesign/core/Icon';
import { IconButton } from '@astryxdesign/core/IconButton';
import { Popover } from '@astryxdesign/core/Popover';
import { Switch } from '@astryxdesign/core/Switch';
import { Heading } from '@astryxdesign/core/Text';
import { VStack } from '@astryxdesign/core/VStack';
import { Settings } from 'lucide-react';

import { useLayoutPreferences } from '@/shared/hooks/use-layout-preferences.js';

/**
 * Header-level "Cài đặt" trigger: persisted layout preferences (hide
 * side nav / focus mode, applied by `ProtectedAppShell`; compact mode —
 * compact tables via the shared `Table`, 1px-smaller text via
 * `ProtectedAppShell`). All live here, one place, instead of
 * scattered per-page toggles — per user request.
 * localStorage-only (`use-layout-preferences.js`), no backend involved.
 */
export function LayoutSettingsMenu() {
  const {
    hideSideNav,
    focusMode,
    compactMode,
    setHideSideNav,
    setFocusMode,
    setCompactMode,
  } = useLayoutPreferences();

  return (
    <Popover
      label="Cài đặt giao diện"
      placement="below"
      alignment="end"
      width={280}
      content={
        <VStack gap={3}>
          <Heading level={4}>Cài đặt giao diện</Heading>
          <Divider />
          <Switch
            label="Ẩn thanh điều hướng"
            description="Ẩn menu bên trái để có thêm không gian xem"
            value={hideSideNav}
            onChange={setHideSideNav}
          />
          <Switch
            label="Chế độ tập trung"
            description="Ẩn cả thanh điều hướng và thanh trên cùng. Nhấn Esc hoặc nút thu nhỏ để thoát."
            value={focusMode}
            onChange={setFocusMode}
          />
          <Switch
            label="Chế độ thu gọn"
            description="Thu gọn dòng của mọi bảng và giảm cỡ chữ 1px để xem được nhiều dữ liệu hơn"
            value={compactMode}
            onChange={setCompactMode}
          />
        </VStack>
      }
    >
      <IconButton
        label="Cài đặt giao diện"
        tooltip="Cài đặt giao diện"
        icon={<Icon icon={Settings} size="sm" />}
        variant="ghost"
        size="sm"
      />
    </Popover>
  );
}
