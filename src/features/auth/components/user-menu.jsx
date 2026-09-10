'use client';

import { Avatar } from '@astryxdesign/core/Avatar';
import { DropdownMenuItem } from '@astryxdesign/core/DropdownMenu';
import { Popover } from '@astryxdesign/core/Popover';
import { Skeleton } from '@astryxdesign/core/Skeleton';
import { Fragment, useState, useSyncExternalStore } from 'react';

import { useSession } from '../hooks/use-session.js';
import { ChangePasswordDialog } from './change-password-dialog.jsx';

// Avatar's "md" size in px — kept in sync manually so the skeleton matches
// the real avatar it's standing in for.
const AVATAR_MD_SIZE = 36;

function noopSubscribe() {
  return () => {};
}

function getIsHydrated() {
  return true;
}

function getIsHydratedServerSnapshot() {
  return false;
}

export function UserMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);
  const { isAuthenticated, displayName, logout } = useSession();
  // useSession's server snapshot always reports logged-out, so on first
  // paint the real avatar isn't known yet. Rather than pop from nothing to
  // an avatar the instant client JS takes over, show a same-sized skeleton
  // for that one frame — matches the topnav-shimmer pattern used elsewhere
  // (e.g. the users table) instead of a layout jump.
  const isHydrated = useSyncExternalStore(
    noopSubscribe,
    getIsHydrated,
    getIsHydratedServerSnapshot,
  );

  if (!isHydrated) {
    return <Skeleton width={AVATAR_MD_SIZE} height={AVATAR_MD_SIZE} radius="rounded" />;
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <>
      <Popover
        isOpen={isOpen}
        onOpenChange={setIsOpen}
        placement="below"
        alignment="end"
        role="none"
        hasCloseButton={false}
        label="Menu tài khoản"
        content={
          <Fragment>
            <DropdownMenuItem
              label="Đổi mật khẩu"
              onClick={() => {
                setIsOpen(false);
                setIsChangePasswordOpen(true);
              }}
            />
            <DropdownMenuItem
              label="Đăng xuất"
              onClick={() => {
                setIsOpen(false);
                logout();
              }}
            />
          </Fragment>
        }
      >
        <Avatar name={displayName} size="md" tooltip={false} onClick={() => {}} />
      </Popover>
      <ChangePasswordDialog
        isOpen={isChangePasswordOpen}
        onOpenChange={setIsChangePasswordOpen}
      />
    </>
  );
}
