# Confirm backend logout

Do not report successful logout or discard revocation credentials when the
backend is unreachable or rejects the revocation request. Keep cookies for an
idempotent retry, bound the wait, and reuse the existing logout error UI.
