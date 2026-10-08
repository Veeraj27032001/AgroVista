import 'server-only';
import { getSupabaseAdmin } from '@/lib/supabase';
import type { ArticleMessage, ArticleMessageSender } from '@/lib/types';

type MessageRow = {
  id: string;
  submission_id: string;
  sender: ArticleMessageSender;
  message: string;
  created_at: string;
};

const toMessage = (r: MessageRow): ArticleMessage => ({
  id: r.id,
  submissionId: r.submission_id,
  sender: r.sender,
  message: r.message,
  createdAt: r.created_at
});

export async function listMessagesForSubmission(submissionId: string): Promise<ArticleMessage[]> {
  const { data, error } = await getSupabaseAdmin()
    .from('article_messages')
    .select('*')
    .eq('submission_id', submissionId)
    .order('created_at', { ascending: true });
  if (error) throw error;
  return (data as MessageRow[]).map(toMessage);
}

export async function createMessage(submissionId: string, sender: ArticleMessageSender, message: string): Promise<ArticleMessage> {
  const { data, error } = await getSupabaseAdmin()
    .from('article_messages')
    .insert({ submission_id: submissionId, sender, message })
    .select('*')
    .single();
  if (error) throw error;
  return toMessage(data as MessageRow);
}
