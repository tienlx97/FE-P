import { CarrierStatusPage } from '@/features/carrier-status/index.js';
import { MetaThemeProvider } from '@/shared/components/custom/meta/theme-provider.jsx';
import { PageContentShell } from '@/shared/components/page-content-shell.jsx';

export const metadata = {
  title: 'Trạng thái API hãng tàu · KT-XNK',
};

/**
 * "/live": carrier schedule / tracking API status. Access is gated by
 * `routeAccessRules` (`logistics:contracts:view`, same as
 * `GET /api/v1/carrier-status`), enforced in the proxy.
 */
export default function LivePage() {
  return (
    <PageContentShell isFullWidth>
      <MetaThemeProvider>
        <CarrierStatusPage />
      </MetaThemeProvider>
    </PageContentShell>
  );
}
