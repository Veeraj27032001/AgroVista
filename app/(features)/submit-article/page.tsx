import { requireAuthorOrAdminOrRedirect } from '@/lib/auth';
import SubmitArticleForm from './SubmitArticleForm';

export default async function SubmitArticlePage() {
  await requireAuthorOrAdminOrRedirect();
  return <SubmitArticleForm />;
}
