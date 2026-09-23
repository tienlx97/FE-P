import './globals.css';

import { QueryProvider } from '../shared/components/query-provider.jsx';
import { ThemeProvider } from '../shared/components/theme-provider.jsx';
import { jetbrainsMono, montserrat } from '../shared/config/fonts.js';
import { site } from '../shared/config/site.js';

export const metadata = {
  title: site.name,
  description: site.description,
};

/**
 * @param {{ children: import('react').ReactNode }} props
 */
export default function RootLayout({ children }) {
  return (
    <html
      lang="vi"
      className={`${montserrat.variable} ${jetbrainsMono.variable}`}
    >
      <body>
        <QueryProvider>
          <ThemeProvider>{children}</ThemeProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
