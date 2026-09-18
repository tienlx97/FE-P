// @ts-nocheck — vendored/ejected source (`astryx swizzle TabList`), stripped
// of its original TypeScript types by a one-off `tsc --jsx preserve`
// transpile rather than hand-annotated with JSDoc — see `Tab.jsx`'s
// matching comment for why `checkJs` gets skipped here.
// Copyright (c) Meta Platforms, Inc. and affiliates.
'use client';
/**
 * @file TabList.tsx
 * @input Uses React, StyleX, TabListContext, useListFocus, useKeyboardHint,
 *   useScrollOverflow, Icon
 * @output Exports TabList component, TabListProps and TabListOverflow types
 * @position Tab strip wrapper; provides TabListContext to Tab and TabMenu
 *   children. A `<nav>` landmark by default; speaks the WAI-ARIA tabs pattern
 *   where the caller asks for it with `role="tablist"`. Owns
 *   roving-tabindex keyboard navigation (Arrow/Home/End) across the tab
 *   strip via the shared useListFocus hook so it is a single Tab stop, and
 *   owns horizontal scrolling when the tabs are wider than the strip.
 *
 * SYNC: When modified, update:
 * - /packages/core/src/TabList/TabList.doc.mjs
 * - /packages/core/src/TabList/index.ts
 * - /packages/core/src/TabList/TabList.test.tsx
 * - /packages/cli/assets/templates/blocks/components/TabList/ (showcase blocks)
 */
import { useListFocus } from '@astryxdesign/core/hooks';
import { useKeyboardHint } from '@astryxdesign/core/hooks';
import { useScrollOverflow } from '@astryxdesign/core/hooks';
import { useMergedRefs } from '@astryxdesign/core/hooks';
import { useTranslator } from '@astryxdesign/core/i18n';
import { Icon } from '@astryxdesign/core/Icon';
import { EDGE_COMP_ATTR } from '@astryxdesign/core/Layout';
import { useSize } from '@astryxdesign/core/SizeContext';
import { borderVars, colorVars, durationVars, easeVars, focusVars, radiusVars, shadowVars, sizeVars, spacingVars, } from '@astryxdesign/core/theme/tokens.stylex';
import { mergeProps, rtlStyles } from '@astryxdesign/core/utils';
import { themeProps } from '@astryxdesign/core/utils';
import { observeResize, unobserveResize } from '@astryxdesign/core/utils';
import { devWarn } from '@astryxdesign/core/utils';
import { focusOutlineProps } from '@astryxdesign/core/utils';
import * as stylex from '@stylexjs/stylex';
import React, { useCallback, useEffect, useMemo, useRef, } from 'react';

import { TabListContext } from './TabListContext.js';
/**
 * Selector matching the focusable stops in the tab strip: every Tab
 * (`[data-tab-value]`) and every TabMenu trigger (`[data-tab-menu]`),
 * in DOM order. Disabled stops are filtered out by the handler.
 */
const TAB_STOP_SELECTOR = '[data-tab-value],[data-tab-menu]';
// `@astryxdesign/core/hooks` in this project's installed version (0.5.0)
// doesn't export `isRtlElement` (the ejected source's package.json wants
// `@astryxdesign/core` newer than what's installed here) — same
// minimal local stand-in `Tab.jsx` documents for its own version-skew
// patches.
function isRtlElement(element) {
  return getComputedStyle(element).direction === 'rtl';
}
function preventFocus(e) {
    e.preventDefault();
}
/** Fraction of the visible strip an arrow press scrolls. */
const SCROLL_PAGE_RATIO = 0.8;
/**
 * A scroll container clips at its padding box, and two things a tab paints sit
 * outside its own box: the focus ring (offset + width) and the selected
 * indicator, which `--_tab-indicator-bottom` pushes further down when a
 * divider rail is reserved. The strip pads by that much and takes the padding
 * straight back off with a negative margin, so nothing is clipped and the tabs
 * stay exactly where they were.
 *
 * A bleed is not free, though. The padding is real geometry: the strip's
 * border box sticks out of the TabList's, and any ancestor that scrolls counts
 * that as something to scroll to. So the ring's share of the bleed is taken
 * only while a ring is actually drawn inside the strip -- the same
 * `:has(:focus-visible)` condition that draws it -- and at rest the strip is
 * exactly as wide and as tall as the TabList, as it was before the strip could
 * scroll. The indicator's share is always taken, because the indicator is
 * always drawn.
 *
 * Turning the bleed on moves nothing: padding and negative margin cancel, so
 * the border box grows outwards and the content stays put.
 */
const RING_BLEED = `calc(${focusVars['--focus-outline-width']} + ${focusVars['--focus-outline-offset']})`;
const BLEED_VAR = '--_tab-strip-bleed';
const BLEED = `var(${BLEED_VAR})`;
const INDICATOR_BLEED = 'calc(-1 * var(--_tab-indicator-bottom, -1px))';
const BLOCK_END_BLEED = `max(${BLEED}, ${INDICATOR_BLEED})`;
/** How far the edge fade runs; wide enough to sit under an arrow. */
const FADE_WIDTH = spacingVars['--spacing-8'];
/**
 * Where the fade turns fully opaque, and — the same distance, for the same
 * reason — how far a revealed stop is kept clear of the edge. Declared as
 * scroll-padding so the browser's own focus scrolling uses it too, and read
 * back from the computed style so the arithmetic below has one source of
 * truth with the CSS.
 */
const SCROLL_EDGE_INSET = `calc(${BLEED} + ${FADE_WIDTH})`;
/**
 * The fade reaches transparent at the strip's *own* edge, not at the bleed
 * edge — otherwise the scroll container paints tabs past the TabList's box,
 * past a divider rail, and past the scroll arrow that caps that edge. Masking
 * the bleed costs nothing: only a faded edge is masked, and a stop at a faded
 * edge never holds focus, so the bleed is still there when the ring needs it.
 */
const FADE_FROM_START = `linear-gradient(to right, transparent ${BLEED}, black ${SCROLL_EDGE_INSET})`;
const FADE_FROM_END = `linear-gradient(to left, transparent ${BLEED}, black ${SCROLL_EDGE_INSET})`;
const styles = stylex.create({
    nav: {
        alignItems: 'stretch',
        display: 'flex',
        gap: spacingVars['--spacing-0-5'],
        maxWidth: '100%',
        minWidth: 0,
        position: 'relative',
    },
    fill: {
        width: '100%',
    },
    divider: {
        borderBottomColor: colorVars['--color-border'],
        borderBottomStyle: 'solid',
        borderBottomWidth: borderVars['--border-width'],
        // Reserve a gap between the tabs and the divider rail so the hover pill
        // (which fills the tab height) no longer touches the underline, and an
        // adjacent same-size Button aligns to the tabs rather than butting the
        // rail. The tabs keep their element-size height; this padding grows the
        // strip. (This fork's `Tab.jsx` drops the underline "selected"
        // indicator entirely — filled pills, not underlined text — so the
        // upstream `--_tab-indicator-bottom` custom property that used to
        // drop it through this gap has no indicator left to position.)
        paddingBlockEnd: spacingVars['--spacing-1'],
    },
    strip: {
        alignItems: 'stretch',
        // Content-height, not stretched: the bleed padding below is inside the
        // strip's own height, and a stretched height would push the tabs out of
        // the scrollport.
        alignSelf: 'flex-start',
        display: 'flex',
        flexGrow: 1,
        flexShrink: 1,
        // Inherited rather than restated so an `xstyle` gap override on the
        // TabList still reaches the tabs.
        gap: 'inherit',
        minWidth: 0,
    },
    stripScroll: {
        // `@stylexjs/valid-styles`'s property allowlist is tied to this
        // project's installed `@stylexjs/stylex@0.15.4` (Astryx core wants
        // `^0.19.0` — see `Tab.jsx`'s file header for the full version-skew
        // reasoning). A computed custom-property key and the
        // `scroll-padding-inline` logical property below are both valid
        // StyleX/CSS the compiler still accepts, just newer than what
        // 0.15.4's lint schema recognizes.
        /* eslint-disable @stylexjs/valid-styles */
        [BLEED_VAR]: {
            default: '0px',
            ':has(:focus-visible)': RING_BLEED,
        },
        marginBlockEnd: `calc(-1 * (${BLOCK_END_BLEED}))`,
        /* eslint-enable @stylexjs/valid-styles */
        marginBlockStart: `calc(-1 * (${BLEED}))`,
        marginInline: `calc(-1 * (${BLEED}))`,
        maskImage: 'none',
        overflowX: 'auto',
        overflowY: 'hidden',
        overscrollBehaviorX: 'contain',
        paddingBlockEnd: BLOCK_END_BLEED,
        paddingBlockStart: BLEED,
        paddingInline: BLEED,
        scrollBehavior: {
            default: 'smooth',
            '@media (prefers-reduced-motion: reduce)': 'auto',
        },
        // eslint-disable-next-line @stylexjs/valid-styles
        scrollPaddingInline: SCROLL_EDGE_INSET,
        scrollbarWidth: 'none',
        transitionDuration: {
            default: durationVars['--duration-medium'],
            '@media (prefers-reduced-motion: reduce)': '0ms',
        },
        transitionProperty: 'mask-image',
        transitionTimingFunction: easeVars['--ease-standard'],
    },
    fadeStart: {
        maskImage: {
            default: FADE_FROM_START,
            ':is([dir="rtl"] *)': FADE_FROM_END,
        },
    },
    fadeEnd: {
        maskImage: {
            default: FADE_FROM_END,
            ':is([dir="rtl"] *)': FADE_FROM_START,
        },
    },
    fadeBoth: {
        maskImage: `linear-gradient(to right, transparent ${BLEED}, black ${SCROLL_EDGE_INSET}, black calc(100% - ${SCROLL_EDGE_INSET}), transparent calc(100% - ${BLEED}))`,
    },
    arrow: {
        alignItems: 'center',
        // Opaque, because it sits over the tabs it scrolls: the strip's edge fade
        // thins the content underneath but does not clear it.
        backgroundColor: colorVars['--color-background-popover'],
        borderRadius: radiusVars['--radius-full'],
        borderStyle: 'none',
        borderWidth: 0,
        boxShadow: shadowVars['--shadow-low'],
        color: {
            default: colorVars['--color-text-secondary'],
            ':hover:where(:not(:disabled,[aria-disabled="true"]))': colorVars['--color-text-primary'],
        },
        cursor: {
            default: 'pointer',
            ':is(:disabled,[aria-disabled="true"])': 'default',
        },
        // A pointer-only affordance: keyboard and assistive-technology users move
        // through the strip with the arrow keys, which scrolls the focused tab
        // into view on its own.
        display: {
            default: 'none',
            '@media (hover: hover)': 'flex',
        },
        insetBlockStart: 0,
        justifyContent: 'center',
        padding: 0,
        position: 'absolute',
    },
    arrowStart: {
        insetInlineStart: 0,
    },
    arrowEnd: {
        insetInlineEnd: 0,
    },
});
const arrowSizeStyles = stylex.create({
    sm: {
        height: sizeVars['--size-element-sm'],
        width: sizeVars['--size-element-sm'],
    },
    md: {
        height: sizeVars['--size-element-md'],
        width: sizeVars['--size-element-md'],
    },
    lg: {
        height: sizeVars['--size-element-lg'],
        width: sizeVars['--size-element-lg'],
    },
});
/**
 * Tab navigation wrapper. Provides context for value/onChange/size
 * to Tab and TabMenu children.
 *
 * @example
 * ```
 * <TabList value={activeTab} onChange={setActiveTab}>
 *   <Tab value="home" label="Home" />
 *   <Tab value="settings" label="Settings" />
 *   <TabMenu label="More">
 *     <Tab value="analytics" label="Analytics" />
 *     <Tab value="reports" label="Reports" />
 *   </TabMenu>
 * </TabList>
 * ```
 */
export function TabList({ ref, value, onChange, size: sizeProp, layout = 'hug', hasDivider = false, role, overflow = 'auto', xstyle, className, style, children, onKeyDown: onKeyDownProp, onFocus: onFocusProp, onBlur: onBlurProp, 'aria-label': ariaLabelFromProps, 'aria-labelledby': ariaLabelledBy, 'aria-orientation': _ariaOrientation, [EDGE_COMP_ATTR]: _edgeCompAttr, ...restProps }) {
    const t = useTranslator();
    const ariaLabel = ariaLabelFromProps ?? t('@astryx.tabList.label');
    const size = useSize(sizeProp, 'md');
    const hasScroll = overflow !== 'visible';
    const stripRef = useRef(null);
    // Only an asserted `role="tablist"` switches the pattern. Left unset the
    // strip is the `<nav>` it has always been, and every other role passes
    // through to the element untouched.
    const isTabList = role === 'tablist';
    // Roving-tabindex keyboard navigation across the tab strip via the shared
    // hook. Under the navigation pattern `orientation: 'both'` accepts both
    // arrow axes per the WAI-ARIA APG allowance for tab strips
    // (ArrowRight/ArrowDown advance, ArrowLeft/ArrowUp retreat). A tablist
    // reports itself as horizontal, so there the strip takes only the
    // horizontal arrows and leaves ArrowUp and ArrowDown to scroll the page. We
    // do not set `aria-orientation` on the `<nav>`: that attribute is invalid on
    // the navigation role and triggers an axe `aria-allowed-attr` violation.
    //
    // `hasRovingTabIndex` makes the hook own the single tab stop: it stamps
    // tabindex 0/-1, repairs the stop on mount and as stops mount/unmount or
    // toggle disabled, and -- via `handleFocus` on the nav -- keeps the stop in
    // sync after clicks or programmatic focus. Individual Tabs still render
    // `tabIndex={isSelected ? 0 : -1}` (see Tab.tsx) as the initial source of
    // truth; the hook's repair preserves an existing tab stop and only promotes
    // the first enabled stop when none is tabbable.
    const { listRef, handleKeyDown, handleFocus } = useListFocus({
        itemSelector: TAB_STOP_SELECTOR,
        orientation: isTabList ? 'horizontal' : 'both',
        hasRovingTabIndex: true,
    });
    const { hintElement, onKeyDown: onHintKeyDown, onFocus: onHintFocus, onBlur: onHintBlur, } = useKeyboardHint();
    const { scrollRef, overflowStart, overflowEnd } = useScrollOverflow();
    const attachStrip = useCallback((el) => {
        stripRef.current = el;
        scrollRef(hasScroll ? el : null);
    }, [hasScroll, scrollRef]);
    const revealStop = useCallback((stop) => {
        const strip = stripRef.current;
        if (!hasScroll || !strip || !stop) {
            return;
        }
        const stripBox = strip.getBoundingClientRect();
        const stopBox = stop.getBoundingClientRect();
        const inset = parseFloat(getComputedStyle(strip).scrollPaddingLeft) || 0;
        const pastEnd = stopBox.right - (stripBox.right - inset);
        const pastStart = stopBox.left - (stripBox.left + inset);
        // A stop wider than the space kept clear cannot be shown whole, so show
        // its reading start, the way `scrollIntoView({inline: 'nearest'})` does.
        const tooWide = stopBox.width > stripBox.width - 2 * inset;
        const delta = tooWide
            ? isRtlElement(strip)
                ? pastEnd
                : pastStart
            : pastEnd > 0
                ? pastEnd
                : pastStart < 0
                    ? pastStart
                    : 0;
        if (delta !== 0) {
            // Not an animation: the strip has to arrive already showing the right
            // tab, so this overrides the CSS smooth behaviour arrow presses use.
            strip.scrollBy({ left: delta, behavior: 'instant' });
        }
    }, [hasScroll]);
    const revealSelectedTab = useCallback(() => {
        const strip = stripRef.current;
        if (!strip) {
            return;
        }
        revealStop(Array.from(strip.querySelectorAll('[data-tab-value]')).find(el => el.dataset.tabValue === value) ?? null);
    }, [revealStop, value]);
    // Both reveals below reach the callback through a ref instead of depending
    // on it: its identity also changes with `overflow`, and that is not a reason
    // to scroll anything.
    const revealSelectedTabRef = useRef(revealSelectedTab);
    useEffect(() => {
        revealSelectedTabRef.current = revealSelectedTab;
    }, [revealSelectedTab]);
    // The tab you are on has to be visible. Selection can move without focus —
    // on mount, or when the host sets `value` itself — and neither scrolls the
    // strip the way clicking or arrowing to a tab does. The check is what makes
    // a selection change the trigger, rather than the effect happening to run.
    const revealedValueRef = useRef(null);
    useEffect(() => {
        if (revealedValueRef.current === value) {
            return;
        }
        revealedValueRef.current = value;
        revealSelectedTabRef.current();
    }, [value]);
    // ...and it has to stay visible when the strip is what moved. A strip that
    // fitted at one width can hide the selected tab at a narrower one, and no
    // prop changes when that happens. This one re-reveals the same selection by
    // design, which is why the check above sits in the effect rather than in
    // `revealSelectedTab`.
    //
    // The wrapper is observed rather than the strip because the shared observer
    // keeps one callback per element and `useScrollOverflow` already holds the
    // strip's.
    useEffect(() => {
        const root = listRef.current;
        if (!hasScroll || !root) {
            return;
        }
        const onResize = () => revealSelectedTabRef.current();
        observeResize(root, onResize);
        return () => unobserveResize(root);
    }, [hasScroll, listRef]);
    const scrollByPage = useCallback((direction) => {
        const strip = stripRef.current;
        if (!strip) {
            return;
        }
        // Under RTL the scroll axis is inverted, so flip the physical delta.
        const rtlSign = isRtlElement(strip) ? -1 : 1;
        strip.scrollBy({
            left: rtlSign * direction * strip.clientWidth * SCROLL_PAGE_RATIO,
        });
    }, []);
    const scrollToStart = useCallback(() => scrollByPage(-1), [scrollByPage]);
    const scrollToEnd = useCallback(() => scrollByPage(1), [scrollByPage]);
    const contextValue = useMemo(() => ({
        value,
        onChange,
        size,
        layout,
        pattern: isTabList ? 'tabs' : 'nav',
    }), [value, onChange, size, layout, isTabList]);
    const handleRootKeyDown = useCallback((e) => {
        onKeyDownProp?.(e);
        if (e.defaultPrevented) {
            return;
        }
        onHintKeyDown(e);
        handleKeyDown(e);
    }, [onKeyDownProp, onHintKeyDown, handleKeyDown]);
    const handleRootFocus = useCallback((e) => {
        onFocusProp?.(e);
        if (e.defaultPrevented) {
            return;
        }
        onHintFocus(e);
        handleFocus(e);
        // The browser scrolls a focused element into view only when it is
        // entirely outside the scrollport, so arrowing onto a half-visible stop
        // leaves it cut off under the fade. Finish the job it started.
        revealStop(e.target.closest(TAB_STOP_SELECTOR));
    }, [onFocusProp, onHintFocus, handleFocus, revealStop]);
    const handleRootBlur = useCallback((e) => {
        onBlurProp?.(e);
        if (e.defaultPrevented) {
            return;
        }
        onHintBlur(e);
    }, [onBlurProp, onHintBlur]);
    // `role="tablist"` owns only tabs, so anything else in the strip is invalid
    // markup. Dev-only, and only under the asserted role — nothing else in the
    // component reads the rendered DOM.
    const hasWarnedContentRef = useRef(false);
    useEffect(() => {
        const strip = stripRef.current;
        if (process.env.NODE_ENV === 'production' ||
            !isTabList ||
            !strip ||
            hasWarnedContentRef.current) {
            return;
        }
        const stranger = Array.from(strip.children).find(child => child.getAttribute('role') !== 'tab');
        if (stranger) {
            hasWarnedContentRef.current = true;
            devWarn('TabList', `role="tablist" owns only tabs, but the strip contains a <${stranger.tagName.toLowerCase()}> that is not one. ` +
                'Render menus and other controls outside the strip, or drop the role for the navigation pattern.');
        }
        // No dependency list: the check is on rendered DOM, which can change
        // without any prop this component could watch.
    });
    const fadeStyle = !hasScroll
        ? null
        : overflowStart && overflowEnd
            ? styles.fadeBoth
            : overflowStart
                ? styles.fadeStart
                : overflowEnd
                    ? styles.fadeEnd
                    : null;
    // A tablist is not navigation, so the landmark element is only right under
    // the navigation pattern. The role is fixed by a prop rather than by what
    // the strip happens to hold, so this is settled once at the callsite.
    const Wrapper = isTabList ? 'div' : 'nav';
    return (<TabListContext value={contextValue}>
      <Wrapper ref={useMergedRefs(ref, listRef)} {...restProps} role={isTabList ? undefined : role} aria-label={isTabList ? undefined : ariaLabel} aria-labelledby={isTabList ? undefined : ariaLabelledBy} onKeyDown={handleRootKeyDown} onFocus={handleRootFocus} onBlur={handleRootBlur} {...{ [EDGE_COMP_ATTR]: '' }} {...mergeProps(themeProps('tab-list', { size }), stylex.props(styles.nav, layout === 'fill' && styles.fill, hasDivider && styles.divider, xstyle), className, style)}>
        <div ref={attachStrip} role={isTabList ? 'tablist' : undefined} aria-label={isTabList ? ariaLabel : undefined} 
    // The name belongs to whichever element carries the widget role.
    aria-labelledby={isTabList ? ariaLabelledBy : undefined} {...mergeProps(themeProps('tab-strip'), stylex.props(styles.strip, hasScroll && styles.stripScroll, fadeStyle))}>
          {children}
        </div>
        {hasScroll && overflowStart && (<button type="button" aria-hidden="true" tabIndex={-1} 
        // Nothing hidden from assistive technology should end up holding
        // focus, and a click would put it here.
        onMouseDown={preventFocus} onClick={scrollToStart} {...mergeProps(themeProps('tab-scroll-button'), focusOutlineProps.focusVisible(styles.arrow, styles.arrowStart, arrowSizeStyles[size]))}>
            <Icon icon="chevronLeft" size="sm" color="inherit" xstyle={rtlStyles.mirror}/>
          </button>)}
        {hasScroll && overflowEnd && (<button type="button" aria-hidden="true" tabIndex={-1} onMouseDown={preventFocus} onClick={scrollToEnd} {...mergeProps(themeProps('tab-scroll-button'), focusOutlineProps.focusVisible(styles.arrow, styles.arrowEnd, arrowSizeStyles[size]))}>
            <Icon icon="chevronRight" size="sm" color="inherit" xstyle={rtlStyles.mirror}/>
          </button>)}
        {hintElement}
      </Wrapper>
    </TabListContext>);
}
TabList.displayName = 'TabList';
