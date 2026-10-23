import { redirect } from 'next/navigation';
import { requireUserOrRedirect } from '@/lib/auth';
import BecomeAuthorForm from './BecomeAuthorForm';

export default async function BecomeAuthorPage() {
  const session = await requireUserOrRedirect();
  if (session.role === 'author' || session.role === 'admin') redirect('/submit-article');
  return <BecomeAuthorForm />;
}
