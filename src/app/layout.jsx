import './globals.css';

import { QueryProvider } from '../shared/components/query-provider.jsx';
import { ThemeProvider } from '../shared/components/theme-provider.jsx';
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
    <html lang="vi">
      <body>
        <QueryProvider>
          <ThemeProvider>{children}</ThemeProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
