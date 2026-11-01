import { requireAuthorOrRedirect } from '@/lib/auth';
import SubmitArticleForm from './SubmitArticleForm';

export default async function SubmitArticlePage() {
  await requireAuthorOrRedirect();
  return <SubmitArticleForm />;
}
