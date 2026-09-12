# Tasks: Pin table header while scrolling

## 1. Sticky header

- [x] 1.1 `theme.js`'s `table-header-cell` gains `position: sticky; top: 0; z-index: 1`; rebuild `theme.built.css` — verify: `./harness/verify.sh` green; computed style confirmed live (`position: sticky`, `top: 0px`, `z-index: 1`) against the running dev stack.
- [x] 1.2 Fix: `table-header-group.jsx`'s `TableHeaderGroupBar` overlay switched from `position: absolute` (container-relative) to `position: fixed` (viewport-relative) + scroll listener, so the "GIÁ TRỊ" label tracks the now-sticky header instead of scrolling away underneath it — verify: `./harness/verify.sh` green.
