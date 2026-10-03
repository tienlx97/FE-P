# Authentication and access UI

Align FE-P with BE-P's session-bound access tokens and reserved Admin role isolation.
Clarify session-ended reasons, CCCD-only remembering, provisioning without login,
and immediate permission/session changes. Show inherited permission company/branch
scope from the backend instead of a hardcoded branch label. Failed permission
requests must not look like an empty permission set. Logout discards cached protected
data and reports cookie-clear failures. Keep the existing Astryx/StyleX design.
