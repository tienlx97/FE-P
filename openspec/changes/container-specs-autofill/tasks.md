# Tasks: Container drawer fills its type and weights from BIC BoxTech

- [x] 1.1 Container weights in the "Container" group, BoxTech fill on blur
  with status / refill / alert / check-digit warning, relaxed weights rule —
  verify: config tests, browser on the dev stack (found, not found, wrong
  check digit, switching numbers, "Điền lại"), gate.
- [x] 1.2 Spinner inside the number field (`TextInput` `isLoading`) while
  BoxTech is asked, replacing the "Đang tra…" line — verify: browser
  (`aria-busy`, spinner at the field's right edge), gate.
