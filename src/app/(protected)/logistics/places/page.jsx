import { redirect } from 'next/navigation';

/** Old "Cảng / Nơi" URL — the catalog is now "Cảng đến" (`/logistics/ports`). */
export default function LogisticsPlacesRedirectPage() {
  redirect('/logistics/ports');
}
