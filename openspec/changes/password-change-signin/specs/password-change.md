# Password change sign in

- A successful POST to users/me/password clears all six browser session cookies
  before the proxy returns; no logout request is necessary because BE already
  committed password and SecurityStamp rotation.
- The self-service dialog immediately reloads `/login?passwordChanged=1` after
  success, discarding protected client caches. Login displays a dismissible
  confirmation and asks for the new password.
- Failed password changes preserve cookies and remain in the form.
- Admin reset of another user preserves the administrator session and existing
  copy/send workflow; it is not treated as a self-service password change.
