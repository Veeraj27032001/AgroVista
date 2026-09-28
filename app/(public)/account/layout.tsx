import { requireUserOrRedirect } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export default async function AccountLayout({ children }: { children: React.ReactNode }) {
  await requireUserOrRedirect();
  return (
    <>
      <link rel="stylesheet" href="/css/profile.css" />
      {children}
    </>
  );
}
