'use client';

import { useMutation } from '@tanstack/react-query';

import { changePassword } from '../api/account.js';

/**
 * No query to invalidate afterwards — a password change has no visible
 * server state for the UI to re-fetch, unlike Admin's grant/revoke-role
 * mutations.
 */
export function useChangePasswordMutation() {
  return useMutation({
    mutationFn: (
      /** @type {{ currentPassword: string, newPassword: string }} */ {
        currentPassword,
        newPassword,
      },
    ) => changePassword(currentPassword, newPassword),
  });
}
