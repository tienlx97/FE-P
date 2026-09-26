import { ValueUtility } from '@/features/utilities/index.js';
import { PageContentShell } from '@/shared/components/page-content-shell.jsx';

export const metadata = {
  title: 'Giá trị · Tiện ích · KT-XNK',
};

/**
 * Access: `/logistics` rule (`logistics:view`) in `routeAccessRules`. The
 * Meta page header lives in `ValueUtility` (a client component: it passes
 * an icon component down).
 */
export default function LogisticsValueUtilityPage() {
  return (
    <PageContentShell>
      <ValueUtility />
    </PageContentShell>
  );
}
