'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';

import { grantAdminRole, revokeAdminRole } from '../api/users.js';

/**
 * Grant/revoke both rotate the target's `SecurityStamp` server-side and
 * change `isAdmin` on both `GET /users/{id}` and the `GET /users` list row
 * — invalidating both queries re-seeds the UI from the real state instead
 * of trusting an optimistic guess.
 * @param {string} userId
 */
export function useGrantAdminRoleMutation(userId) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => grantAdminRole(userId),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users', 'user', userId] });
      queryClient.invalidateQueries({ queryKey: ['admin-users', 'users'] });
    },
  });
}

/** @param {string} userId */
export function useRevokeAdminRoleMutation(userId) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => revokeAdminRole(userId),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users', 'user', userId] });
      queryClient.invalidateQueries({ queryKey: ['admin-users', 'users'] });
    },
  });
}
