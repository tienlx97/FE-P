import assert from 'node:assert/strict';
import { readdir, readFile } from 'node:fs/promises';
import test from 'node:test';

const shellSource = await readFile(
  new URL('./protected-app-shell.jsx', import.meta.url),
  'utf8',
);
const headerSource = await readFile(
  new URL('./header.jsx', import.meta.url),
  'utf8',
);
const sideNavSource = await readFile(
  new URL('./side-nav.jsx', import.meta.url),
  'utf8',
);
const contentSources = await Promise.all(
  [
    './copy-page-link-button.jsx',
    './footer.jsx',
    './mdx-article.jsx',
    './mdx-page-heading.jsx',
    './table-of-contents.jsx',
  ].map((path) => readFile(new URL(path, import.meta.url), 'utf8')),
);
const mdxUiSources = await Promise.all(
  [
    './intro.jsx',
    './mdx-components.jsx',
    './mdx/deep-dive.jsx',
    './mdx/figure.jsx',
    './mdx/heading-anchor-icon.jsx',
    './mdx/note.jsx',
    './mdx/pitfall.jsx',
    './mdx/you-will-learn.jsx',
    './mdx/youtube-embed.jsx',
  ].map((path) => readFile(new URL(path, import.meta.url), 'utf8')),
);
const mdxDirectory = new URL('./mdx/', import.meta.url);
const mdxComponentTreeSources = await Promise.all(
  [
    './intro.jsx',
    './mdx-components.jsx',
    ...(await readdir(mdxDirectory, { recursive: true }))
      .filter((path) => /\.(?:js|jsx)$/u.test(path))
      .map((path) => `./mdx/${path}`),
  ].map((path) => readFile(new URL(path, import.meta.url), 'utf8')),
);

test('uses the react.dev shell geometry without Astryx shell UI', () => {
  assert.doesNotMatch(shellSource, /@astryxdesign\/core\/(AppShell|MobileNav)/);
  assert.match(shellSource, /minHeight: 'calc\(100vh - 64px\)'/);
  assert.match(
    shellSource,
    /'@media \(min-width: 1024px\)': '15rem minmax\(0, 1fr\)'/,
  );
  assert.match(shellSource, /insetBlockStart: '64px'/);
  assert.match(headerSource, /height: '64px'/);
});

test('keeps the exact react.dev mobile-to-desktop boundary', () => {
  assert.match(shellSource, /matchMedia\('\(max-width: 1023px\)'\)/);
  assert.match(shellSource, /'@media \(min-width: 1024px\)'/);
});

test('implements TopNav with semantic UI and react.dev desktop behavior', () => {
  assert.doesNotMatch(
    headerSource,
    /@astryxdesign\/core\/(HStack|Icon|TopNav)/,
  );
  assert.match(headerSource, /backdropFilter: 'blur\(16px\) saturate\(200%\)'/);
  assert.match(headerSource, /transitionDuration: '300ms'/);
  assert.match(headerSource, /'@media \(min-width: 1919px\)'/);
  assert.match(headerSource, /aria-controls="mobile-docs-navigation"/);
});

test('manages mobile overlay focus without Astryx MobileNav state', () => {
  assert.match(shellSource, /mobileOverlayRef/);
  assert.match(shellSource, /firstInteractive\.focus\(\)/);
  assert.match(shellSource, /mobileToggleRef\.current\?\.focus\(\)/);
  assert.match(shellSource, /isMobile/);
});

test('ports the react.dev sidebar tree without Astryx UI primitives', () => {
  assert.doesNotMatch(
    sideNavSource,
    /@astryxdesign\/core\/(Icon|Text|SideNav)/,
  );
  assert.match(sideNavSource, /'@media \(min-width: 1024px\)': '20px'/);
  assert.match(
    sideNavSource,
    /'@media \(min-width: 1024px\)': '0 16px 16px 0'/,
  );
  assert.match(sideNavSource, /transitionDuration: '250ms'/);
  assert.match(sideNavSource, /gridTemplateRows: '1fr'/);
  assert.match(sideNavSource, /expandedGroupKey === routeKey/);
  assert.match(sideNavSource, /toggleSidebarGroup\(/);
  assert.doesNotMatch(sideNavSource, /useState\(containsActiveRoute\)/);
  assert.match(sideNavSource, /fontSize: '0\.9375rem'/);
  assert.match(sideNavSource, /fontSize: '0\.8125rem'/);
  assert.match(
    sideNavSource,
    /childRow:[\s\S]*?fontSize: '0\.8125rem'[\s\S]*?fontWeight: fontWeightVars\['--font-weight-medium'\]/,
  );
  const selectedStyle = sideNavSource.match(
    /selected: \{([\s\S]*?)\n\s{2}\},/u,
  )?.[1];
  assert.ok(selectedStyle);
  assert.doesNotMatch(selectedStyle, /fontSize/);
  assert.match(
    selectedStyle,
    /fontWeight: fontWeightVars\['--font-weight-bold'\]/,
  );
});

test('ports content regions to semantic StyleX with exact width axes', () => {
  const combinedSource = contentSources.join('\n');
  assert.doesNotMatch(
    combinedSource,
    /@astryxdesign\/core\/(Button|Grid|Heading|HStack|Icon|Section|Stack|Text|VStack)/,
  );
  assert.match(combinedSource, /default: '20px'/);
  assert.match(combinedSource, /'@media \(min-width: 640px\)': '48px'/);
  assert.match(combinedSource, /maxWidth: '56rem'/);
  assert.match(combinedSource, /maxWidth: '80rem'/);
  assert.match(
    combinedSource,
    /'@media \(min-width: 1536px\)': 'minmax\(0, 1fr\) 20rem'/,
  );
});

test('matches react.dev TOC typography and sticky scroller geometry', () => {
  const tocSource = contentSources.at(-1);
  assert.match(tocSource, /fontSize: '0\.8125rem'/);
  assert.match(
    tocSource,
    /fontWeight: fontWeightVars\['--font-weight-medium'\]/,
  );
  const activeLinkStyle = tocSource.match(
    /activeLink: \{([\s\S]*?)\n\s{2}\},/u,
  )?.[1];
  assert.ok(activeLinkStyle);
  assert.doesNotMatch(activeLinkStyle, /fontSize/);
  assert.match(tocSource, /borderEndStartRadius: '12px'/);
  assert.match(tocSource, /borderStartStartRadius: '12px'/);
  assert.match(tocSource, /maxHeight: 'calc\(100vh - 7\.5rem\)'/);
  assert.match(tocSource, /position: 'sticky'/);
  assert.match(tocSource, /top: 0/);
});

test('keeps the complete MDX component tree semantic and Astryx-free', () => {
  const combinedSource = mdxUiSources.join('\n');
  const completeTreeSource = mdxComponentTreeSources.join('\n');
  assert.doesNotMatch(completeTreeSource, /@astryxdesign\/core/);
  assert.match(combinedSource, /\.\/mdx\/tokens\.stylex\.js/);
  assert.match(combinedSource, /<blockquote/);
  assert.match(combinedSource, /<details/);
  assert.match(completeTreeSource, /<pre/);
  assert.match(combinedSource, /<iframe/);
});

test('preserves Intro typography on its generated MDX paragraph', () => {
  const mdxComponentsSource = mdxUiSources.at(1);
  assert.match(mdxComponentsSource, /paragraph/);
  assert.match(mdxComponentsSource, /:is\(\[data-mdx-intro\] \*\)/);
  assert.match(mdxComponentsSource, /fontSize: '20px'/);
  assert.match(mdxComponentsSource, /'32\.5px'/);
});

test('pins the exact react.dev documentation typography scale', () => {
  const combinedContentSource = contentSources.join('\n');
  const mdxComponentsSource = mdxUiSources.at(1);
  assert.match(shellSource, /fontSize: '17px'/);
  assert.match(shellSource, /lineHeight: '30px'/);
  assert.match(combinedContentSource, /fontSize: '40px'/);
  assert.match(mdxComponentsSource, /h1: \{ fontSize: '40px' \}/);
  assert.match(
    mdxComponentsSource,
    /h2: \{ fontSize: '28px', lineHeight: '40px' \}/,
  );
  assert.match(
    mdxComponentsSource,
    /h3: \{ fontSize: '24px', lineHeight: '36px' \}/,
  );
  assert.match(mdxComponentTreeSources.join('\n'), /fontSize: '13\.6px'/);
  assert.match(mdxComponentTreeSources.join('\n'), /lineHeight: '24px'/);
});
