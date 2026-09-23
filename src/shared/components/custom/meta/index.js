/**
 * "Meta" custom component folder (user request, 2026-09-23) — the
 * "Optimistic VF Commerce & Hardware" design system (`DESIGN.md`, this same
 * folder) mapped onto a custom Astryx theme (`theme.js`). Screen-specific
 * wrapper components are added here as mockups arrive; wrap the subtree
 * that should use it in `MetaThemeProvider`. Every component here is
 * composed from Astryx components only (golden rule #15).
 *
 * Rebuild after editing `theme.js`:
 *   pnpm exec astryx theme build src/shared/components/custom/meta/theme.js --out src/shared/components/custom/meta/theme.built.css
 *
 * @example
 * import { MetaThemeProvider } from '@/shared/components/custom/meta/index.js';
 *
 * <MetaThemeProvider>{children}</MetaThemeProvider>
 */
export { MetaCountBadge } from './count-badge.jsx';
export { MetaPagination } from './pagination.jsx';
export { MetaStatusBadge } from './status-badge.jsx';
export { MetaThemeProvider } from './theme-provider.jsx';
// The *built* theme (`meta.js`), same object `MetaThemeProvider` applies.
export { metaTheme } from './meta.js';
