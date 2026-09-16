import { JetBrains_Mono, Montserrat } from 'next/font/google';

// Stone's own heading/code faces, self-hosted via next/font (no runtime
// request to Google, layout-shift-safe). next/font never exposes a literal
// "Montserrat"/"JetBrains Mono" family name — theme.js's
// `--font-family-heading`/`--font-family-code` tokens reference these CSS
// vars instead. Both families ship a `vietnamese` subset (unlike Stone's
// default body face, Figtree — see theme.js for why body stays on
// Optimistic Text Vietnamese).
export const montserrat = Montserrat({
  subsets: ['vietnamese', 'latin', 'latin-ext'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-montserrat',
  display: 'swap',
});

export const jetbrainsMono = JetBrains_Mono({
  subsets: ['vietnamese', 'latin', 'latin-ext'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-jetbrains-mono',
  display: 'swap',
});
