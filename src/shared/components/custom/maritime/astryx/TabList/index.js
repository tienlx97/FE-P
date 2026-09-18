// Swizzled from Astryx's `TabList` (`astryx swizzle TabList`, 2026-09-18)
// — see `Tab.jsx`'s file header for why this is ejected rather than
// themed. `TabMenu` isn't re-exported: this fork's `Tab.jsx` drops the
// `stylex.when.ancestor`/`defineMarker` hover marker `TabMenu.tsx` also
// depended on (not installed in this project's `@stylexjs/stylex`
// version), and `tab-nav.jsx` has no "more" overflow tab needing it.
export { Tab } from './Tab.jsx';
export { TabList } from './TabList.jsx';
export { useTabListContext } from './TabListContext.js';
