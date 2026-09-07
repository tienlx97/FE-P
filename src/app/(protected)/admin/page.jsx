import { redirect } from 'next/navigation';

// The index route just forwards to user management, the most common landing
// spot, instead of rendering a dashboard with links to every admin feature.
export default function AdminPage() {
  redirect('/admin/users');
}
