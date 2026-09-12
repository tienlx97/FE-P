# Tasks: Pin table header while scrolling

## 1. Sticky header

- [x] 1.1 `theme.js`'s `table-header-cell` gains `position: sticky; top: 0; z-index: 1`; rebuild `theme.built.css` — verify: `./harness/verify.sh` green; computed style confirmed live (`position: sticky`, `top: 0px`, `z-index: 1`) against the running dev stack.
