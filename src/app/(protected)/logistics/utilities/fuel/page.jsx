import { fetchFuelNews, FuelPriceUtility } from '@/features/utilities/index.js';
import { PageContentShell } from '@/shared/components/page-content-shell.jsx';

export const metadata = {
  title: 'Xăng dầu · Tiện ích · KT-XNK',
};

/**
 * Access: `/logistics` rule (`logistics:view`) in `routeAccessRules`. The
 * news feed is read here on the server; the Meta page header lives in
 * `FuelPriceUtility`.
 */
export default async function LogisticsFuelUtilityPage() {
  const articles = await fetchFuelNews();

  return (
    <PageContentShell>
      <FuelPriceUtility articles={articles} />
    </PageContentShell>
  );
}
