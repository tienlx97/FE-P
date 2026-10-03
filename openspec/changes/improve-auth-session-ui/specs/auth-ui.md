# Authentication and access UI

- Login explains CCCD/password, validates 12 digits without dropping leading zeros,
  shows Vietnamese invalid-credential feedback, and shows only the most specific
  session-ended notice. Remembering saves CCCD only, not password or session lifetime.
- Return navigation accepts only local paths and avoids returning to login.
- Logout names the current device, prevents duplicate clicks, reports failure,
  and reloads after clearing cookies so protected caches cannot survive.
- Employee permission previews render server-defined company/branch scopes and
  readable labels. Reserved Admin access is explicitly separate from departments.
- Permission load errors are visible, never rendered as an empty granted set.
- Provisioning explains that the employee signs in separately. Permission changes
  end existing sessions; enabling concurrent sessions makes device logout independent,
  while disabling them ends all existing sessions immediately.
