# Confirmed logout

- Backend 2xx acknowledgement permits clearing all session cookies and success.
- Non-2xx, transport failure or timeout returns 503 without clearing cookies,
  preserving the credential so the user can retry the idempotent backend logout.
- Access cookie without a refresh credential returns 503, never unconfirmed success.
- No access or refresh cookie is already logged out and succeeds idempotently.
- The backend attempt is bounded to ten seconds.
