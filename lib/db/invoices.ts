import 'server-only';
import { getSupabaseAdmin } from '@/lib/supabase';

export type InvoiceLine = {
  description: string;
  hsnSac?: string;
  quantity: number;
  taxableValuePaise: number;
  taxRatePercent: number;
  cgstPaise: number;
  sgstPaise: number;
  igstPaise: number;
  totalPaise: number;
};

export type Invoice = {
  id: string;
  invoiceNumber: string;
  type: 'invoice' | 'credit_note';
  paymentId: string;
  refundId: string | null;
  originalInvoiceId: string | null;
  billedToName: string | null;
  billedToEmail: string | null;
  billedToPhone: string | null;
  billedToGstin: string | null;
  billedToAddress: string | null;
  lines: InvoiceLine[];
  taxableTotalPaise: number;
  cgstPaise: number;
  sgstPaise: number;
  igstPaise: number;
  grandTotalPaise: number;
  issuedAt: string;
};

type Row = {
  id: string;
  invoice_number: string;
  type: 'invoice' | 'credit_note';
  payment_id: string;
  refund_id: string | null;
  original_invoice_id: string | null;
  billed_to_name: string | null;
  billed_to_email: string | null;
  billed_to_phone: string | null;
  billed_to_gstin: string | null;
  billed_to_address: string | null;
  lines: InvoiceLine[];
  taxable_total_paise: number;
  cgst_paise: number;
  sgst_paise: number;
  igst_paise: number;
  grand_total_paise: number;
  issued_at: string;
};

const toInvoice = (r: Row): Invoice => ({
  id: r.id,
  invoiceNumber: r.invoice_number,
  type: r.type,
  paymentId: r.payment_id,
  refundId: r.refund_id,
  originalInvoiceId: r.original_invoice_id,
  billedToName: r.billed_to_name,
  billedToEmail: r.billed_to_email,
  billedToPhone: r.billed_to_phone,
  billedToGstin: r.billed_to_gstin,
  billedToAddress: r.billed_to_address,
  lines: r.lines,
  taxableTotalPaise: r.taxable_total_paise,
  cgstPaise: r.cgst_paise,
  sgstPaise: r.sgst_paise,
  igstPaise: r.igst_paise,
  grandTotalPaise: r.grand_total_paise,
  issuedAt: r.issued_at
});

/** Financial-year label for GST sequencing, e.g. 1 Oct 2026 -> "2026-27" (FY runs Apr-Mar). */
function financialYearLabel(d: Date): string {
  const year = d.getMonth() >= 3 ? d.getFullYear() : d.getFullYear() - 1;
  return `${year}-${String((year + 1) % 100).padStart(2, '0')}`;
}

async function generateInvoiceNumber(prefix: 'AGX' | 'AGX/CN'): Promise<string> {
  const fy = financialYearLabel(new Date());
  const db = getSupabaseAdmin();
  const likePattern = `${prefix}/${fy}/%`;
  const { count } = await db.from('invoices').select('*', { count: 'exact', head: true }).like('invoice_number', likePattern);
  return `${prefix}/${fy}/${String((count ?? 0) + 1).padStart(5, '0')}`;
}

/**
 * A payment can only ever have ONE invoice (the FK is unique by payment_id
 * in spirit, enforced here by checking first — this function is safe to call
 * once per confirmed payment, from each payment-confirmation code path).
 */
export async function createInvoiceForPayment(params: {
  paymentId: string;
  billedToName?: string;
  billedToEmail?: string;
  billedToPhone?: string;
  billedToGstin?: string;
  billedToStateId?: string;
  billedToAddress?: string;
  lines: InvoiceLine[];
}): Promise<Invoice> {
  const db = getSupabaseAdmin();
  const { data: existing } = await db.from('invoices').select('*').eq('payment_id', params.paymentId).eq('type', 'invoice').maybeSingle();
  if (existing) return toInvoice(existing as Row);

  const invoiceNumber = await generateInvoiceNumber('AGX');
  const taxableTotalPaise = params.lines.reduce((s, l) => s + l.taxableValuePaise, 0);
  const cgstPaise = params.lines.reduce((s, l) => s + l.cgstPaise, 0);
  const sgstPaise = params.lines.reduce((s, l) => s + l.sgstPaise, 0);
  const igstPaise = params.lines.reduce((s, l) => s + l.igstPaise, 0);
  const grandTotalPaise = params.lines.reduce((s, l) => s + l.totalPaise, 0);

  const { data, error } = await db
    .from('invoices')
    .insert({
      invoice_number: invoiceNumber,
      type: 'invoice',
      payment_id: params.paymentId,
      billed_to_name: params.billedToName || null,
      billed_to_email: params.billedToEmail || null,
      billed_to_phone: params.billedToPhone || null,
      billed_to_gstin: params.billedToGstin || null,
      billed_to_state_id: params.billedToStateId || null,
      billed_to_address: params.billedToAddress || null,
      lines: params.lines,
      taxable_total_paise: taxableTotalPaise,
      cgst_paise: cgstPaise,
      sgst_paise: sgstPaise,
      igst_paise: igstPaise,
      grand_total_paise: grandTotalPaise
    })
    .select('*')
    .single();
  if (error) throw error;
  return toInvoice(data as Row);
}

export async function createCreditNote(params: {
  originalInvoiceId: string;
  paymentId: string;
  refundId: string;
  lines: InvoiceLine[];
}): Promise<Invoice> {
  const invoiceNumber = await generateInvoiceNumber('AGX/CN');
  const original = await getInvoice(params.originalInvoiceId);
  const taxableTotalPaise = params.lines.reduce((s, l) => s + l.taxableValuePaise, 0);
  const cgstPaise = params.lines.reduce((s, l) => s + l.cgstPaise, 0);
  const sgstPaise = params.lines.reduce((s, l) => s + l.sgstPaise, 0);
  const igstPaise = params.lines.reduce((s, l) => s + l.igstPaise, 0);
  const grandTotalPaise = params.lines.reduce((s, l) => s + l.totalPaise, 0);

  const { data, error } = await getSupabaseAdmin()
    .from('invoices')
    .insert({
      invoice_number: invoiceNumber,
      type: 'credit_note',
      payment_id: params.paymentId,
      refund_id: params.refundId,
      original_invoice_id: params.originalInvoiceId,
      billed_to_name: original?.billedToName || null,
      billed_to_email: original?.billedToEmail || null,
      billed_to_phone: original?.billedToPhone || null,
      billed_to_gstin: original?.billedToGstin || null,
      billed_to_address: original?.billedToAddress || null,
      lines: params.lines,
      taxable_total_paise: taxableTotalPaise,
      cgst_paise: cgstPaise,
      sgst_paise: sgstPaise,
      igst_paise: igstPaise,
      grand_total_paise: grandTotalPaise
    })
    .select('*')
    .single();
  if (error) throw error;
  return toInvoice(data as Row);
}

export async function getInvoice(id: string): Promise<Invoice | null> {
  const { data, error } = await getSupabaseAdmin().from('invoices').select('*').eq('id', id).maybeSingle();
  if (error) throw error;
  return data ? toInvoice(data as Row) : null;
}

export async function listInvoicesByEmail(email: string): Promise<Invoice[]> {
  const { data, error } = await getSupabaseAdmin().from('invoices').select('*').eq('billed_to_email', email).order('issued_at', { ascending: false });
  if (error) throw error;
  return (data as Row[]).map(toInvoice);
}

export async function listAllInvoices(): Promise<Invoice[]> {
  const { data, error } = await getSupabaseAdmin().from('invoices').select('*').order('issued_at', { ascending: false });
  if (error) throw error;
  return (data as Row[]).map(toInvoice);
}

export type TaxProductType = 'digital_issue' | 'print_issue' | 'subscription_digital' | 'subscription_print' | 'publication_charge' | 'shipping';

/** 0 (receipt-only, no GST breakout) until an admin configures a real rate in Settings -> Tax rates. */
export async function getTaxRatePercent(productType: TaxProductType): Promise<number> {
  const { data } = await getSupabaseAdmin()
    .from('tax_rates')
    .select('rate_percent')
    .eq('product_type', productType)
    .lte('effective_from', new Date().toISOString().slice(0, 10))
    .order('effective_from', { ascending: false })
    .limit(1)
    .maybeSingle();
  return data ? Number(data.rate_percent) : 0;
}
