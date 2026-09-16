import { defineTheme } from '@astryxdesign/core/theme';
import { stoneTheme } from '@astryxdesign/theme-stone';

// Astryx's shipped Stone theme (earthy neutral, pill radius, Montserrat
// headings, rich component coverage) as the base, with the DN Group brand
// layered on top: logo teal for the accent family, logo red for dangerous
// actions. Both sampled from public/images/logo-dn-group.png, same as
// before this migrated off a from-scratch defineTheme (redesign-theme-stone).
export const ktxnkTheme = defineTheme({
  name: 'kt-xnk',
  extends: stoneTheme,
  tokens: {
    // Brand teal, exactly as it appears in the logo — drives primary
    // buttons, focus rings, links, and accent-colored icons. Stone's own
    // accent-family tokens are literal hex, not var(--color-accent)
    // references, so each one needs its own override here (defineTheme's
    // documented caveat: overriding --color-accent alone does not re-point
    // these siblings, least of all --color-on-accent).
    '--color-accent': '#247768',
    '--color-accent-muted': '#e5f3ed',
    '--color-text-accent': '#247768',
    '--color-icon-accent': '#247768',
    '--color-on-accent': '#ffffff',

    // Vietnamese-first body text: Stone's default body face (Figtree) ships
    // no Vietnamese subset, so it would silently mix with a fallback system
    // font on every diacritic — the exact bug vietnamese-font-coverage fixed
    // for Optimistic. Keep the existing complete-coverage family here.
    '--font-family-body':
      '"Optimistic Text Vietnamese", "Optimistic Text", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
    // Stone's own heading/code faces (Montserrat, JetBrains Mono — both do
    // carry a Vietnamese subset), self-hosted via next/font
    // (`src/shared/config/fonts.js`, applied on <html> in `layout.jsx`).
    // next/font never exposes a literal "Montserrat" family name, so these
    // reference its generated CSS vars instead, keeping Stone's own
    // fallback tail behind them.
    '--font-family-heading':
      'var(--font-montserrat), "Figtree", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
    '--font-family-code':
      'var(--font-jetbrains-mono), "SF Mono", Monaco, Consolas, monospace',
  },
  components: {
    // Astryx's Button `variant` prop is an emphasis level, not a brand hue.
    // `variant="secondary"` is Cancel/Hủy across ~46 files app-wide — Stone's
    // own neutral outline treatment for it (inherited, no override here) is
    // the semantically correct choice, not a second brand color. The logo
    // red belongs on `variant="destructive"` instead (Xóa and other
    // dangerous actions), replacing Stone's default soft red-tint pill with
    // a solid fill so it carries real visual weight.
    button: {
      'variant:destructive': {
        backgroundColor: '#c2252a', // logo red, 5.85:1 against the white label
        color: '#ffffff',
        // Astryx's built-in variants derive :hover/:active automatically via
        // color-mix(base, --color-tint-hover); a flat component override
        // like this one doesn't inherit that, so it must be declared
        // explicitly or the button has no press/hover feedback at all.
        ':hover': {
          backgroundColor:
            'color-mix(in srgb, #c2252a, var(--color-tint-hover) 15%)',
        },
        ':active': {
          backgroundColor:
            'color-mix(in srgb, #c2252a, var(--color-tint-hover) 25%)',
        },
      },
    },
    // A `text-input`/`number-input`/`textarea` `readonly` background used
    // to live here (added 2026-09-07 so a read-only TextInput doesn't
    // render pixel-identical to an empty editable one, or read as
    // `isDisabled` — see git history for the original comment). Moved to
    // app-level StyleX instead (`readonly-input-style.jsx`, applied by
    // `text-input.jsx`/`number-input.jsx`/`text-area.jsx`) — this compiled
    // override renders as plain white in a production build: both this and
    // Astryx's own component base styles compile into real CSS `@layer`s,
    // and cascade layers resolve purely by layer order, not selector
    // specificity, so this override lost to Astryx's base styles whenever
    // a production chunk split happened to register their layer after this
    // one (confirmed against a local `next build` + `next start`,
    // 2026-09-16). `readonly-input-style.jsx`'s doc comment has the full
    // mechanism; the same background value and "no borderColor override"
    // reasoning (InputGroup's shared border seam) still applies there.
    // astryx's Toast only ships `type: 'info' | 'error'` — every save
    // confirmation in this app fires an unthemed 'success' type (see
    // `useAppToast`), which without this override renders identical to
    // 'info' (same dark inverted surface). Per user request (2026-09-08),
    // give it the conventional green instead.
    toast: {
      'type:success': {
        backgroundColor: 'var(--color-success)',
        color: 'var(--color-on-success)',
      },
    },
    // `Table`'s own scroll wrapper is `overflow: auto` on *both* axes
    // (needed for horizontal scroll on wide tables) — per the CSS overflow
    // spec, a "visible" value on one axis forces itself to "auto" when the
    // other axis isn't "visible", so there's no way to keep horizontal
    // auto-scroll while leaving vertical overflow alone. That auto-overflow
    // ancestor is exactly what `position: sticky` resolves against, so
    // without a bounded height here the header's sticky `top: 0` was
    // anchoring to an ever-growing, never-actually-scrolled box — it never
    // visibly stuck to anything (caught live with 50 seeded rows,
    // 2026-09-12). Giving the wrapper a real height turns it into the
    // scrolling box sticky needs — the table now scrolls internally,
    // independent of the page, with its own header staying pinned to the
    // top of that scroll box.
    //
    // `height: '100%'` (was a flat `maxHeight: '65vh'` guess) so the table
    // fills whatever real height its ancestor chain gives it —
    // `AdvanceTable`'s `Layout height="fill"` / `LayoutContent`, itself
    // filling the page down to the viewport bottom — instead of always
    // stopping at a fixed fraction of the viewport regardless of how much
    // room is actually free below it (reported 2026-09-14, referencing
    // MISA's own report grid: table fills the remaining height, with its
    // header, totals row, and pagination all pinned). Requires every
    // ancestor up to that `Layout` to resolve to a real height too — see
    // `tanstack-data-table.jsx`'s `styles.wrapper` and
    // `page-content-shell.jsx`'s `fillHeight` prop.
    'table-scroll-wrapper': {
      base: { height: '100%' },
    },
    // Paint cells as well as the section so pinned headers stay opaque.
    // `position: sticky` goes on the header *cells* (`<th>`), not the
    // `<thead>` itself — sticky on a table-header-group isn't reliably
    // supported across browsers, sticky on each cell is (2026-09-12, per
    // user request to keep the header visible while scrolling).
    'table-header': {
      base: { backgroundColor: '#dceee8' },
    },
    'table-header-cell': {
      base: {
        backgroundColor: '#dceee8',
        color: '#18594e',
        position: 'sticky',
        top: '0',
        // Sticky-left/-right body cells (`useTableStickyColumns`) are
        // ALSO `position: sticky` at `z-index: 1` — with equal z-index,
        // DOM order wins ties, and `<tbody>` comes after `<thead>`, so a
        // sticky body cell painted over the header's own label once both
        // were stuck at the same screen position (caught live with 50
        // seeded rows and a sticky-start column, 2026-09-12). `2` beats
        // every sticky body cell regardless of which edge it's pinned to.
        zIndex: '2',
      },
    },
    'table-body': {
      base: { backgroundColor: 'var(--color-background-card)' },
    },
    'table-footer': {
      base: { backgroundColor: 'var(--color-background-muted)' },
    },
    tab: {
      selected: {
        backgroundColor: 'var(--color-accent-muted)',
        color: 'var(--color-text-accent)',
      },
    },
  },
});
