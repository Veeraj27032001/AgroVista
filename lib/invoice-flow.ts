import 'server-only';
import { splitGst } from '@/lib/tax';
import { createInvoiceForPayment, getTaxRatePercent, type TaxProductType } from '@/lib/db/invoices';
import { recordCapturedPayment, type PaymentPurpose } from '@/lib/db/payments';
import { getStateName } from '@/lib/db/locations';
import { getSetting } from '@/lib/db/settings';

type BusinessDetails = { legal_name: string; address: string; gstin: string; state: string; support_email: string; support_phone: string };

/**
 * Records the payment in the unified ledger and issues an invoice for it.
 * Safe to call for every confirmed payment regardless of which legacy table
 * (issue_orders / subscriptions / article_payments) owns the business record —
 * this is purely additive bookkeeping, it never changes what anyone is charged.
 */
export async function recordPaymentAndIssueInvoice(params: {
  userId?: string;
  purpose: PaymentPurpose;
  amountRupees: number;
  razorpayOrderId?: string;
  razorpayPaymentId: string;
  productType: TaxProductType;
  description: string;
  buyerStateId?: string | null;
  billedToName?: string;
  billedToEmail?: string;
  billedToPhone?: string;
  billedToGstin?: string;
  billedToAddress?: string;
}) {
  const payment = await recordCapturedPayment({
    userId: params.userId,
    purpose: params.purpose,
    amountRupees: params.amountRupees,
    razorpayOrderId: params.razorpayOrderId,
    razorpayPaymentId: params.razorpayPaymentId
  });

  const business = await getSetting<BusinessDetails>('business_details', {
    legal_name: '',
    address: '',
    gstin: '',
    state: '',
    support_email: '',
    support_phone: ''
  });
  const ratePercent = await getTaxRatePercent(params.productType);
  const buyerStateName = params.buyerStateId ? await getStateName(params.buyerStateId) : null;
  const amountPaise = Math.round(params.amountRupees * 100);
  const split = splitGst({ amountPaise, ratePercent, buyerStateName, businessStateName: business.state || null });

  const invoice = await createInvoiceForPayment({
    paymentId: payment.id,
    billedToName: params.billedToName,
    billedToEmail: params.billedToEmail,
    billedToPhone: params.billedToPhone,
    billedToGstin: params.billedToGstin,
    billedToAddress: params.billedToAddress,
    lines: [
      {
        description: params.description,
        quantity: 1,
        taxableValuePaise: split.taxableValuePaise,
        taxRatePercent: ratePercent,
        cgstPaise: split.cgstPaise,
        sgstPaise: split.sgstPaise,
        igstPaise: split.igstPaise,
        totalPaise: split.totalPaise
      }
    ]
  });

  return { payment, invoice };
}
