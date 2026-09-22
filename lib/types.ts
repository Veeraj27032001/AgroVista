export type Role = 'user' | 'admin';
export type Format = 'soft' | 'hard' | 'both';
export type IssueStatus = 'draft' | 'published';
export type SubscriptionStatus = 'pending' | 'active' | 'expired' | 'cancelled';
export type OrderStatus =
  | 'pending'
  | 'processing'
  | 'out_for_delivery'
  | 'delivered'
  | 'return_requested'
  | 'returned'
  | 'refund_initiated'
  | 'refund_processing'
  | 'refund_completed'
  | 'refund_failed'
  | 'reissue_initiated'
  | 'new_copy_dispatched'
  | 'reissue_delivered';
export type PaymentStatus = 'pending' | 'paid' | 'failed';
export type ReturnStatus = 'pending' | 'reviewed' | 'actioned';
export type ReturnAction = 'reissue' | 'refund' | 'reject';
export type SubmissionStatus = 'submitted' | 'under_review' | 'revision_requested' | 'resubmitted' | 'accepted';
export type DiscountType = 'flat' | 'percent';
export type CouponUsageType = 'one_time' | 'recurring';

export type User = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  pincode: string | null;
  role: Role;
  createdAt: string;
};

export type PublicationYear = {
  id: string;
  year: number;
  isActive: boolean;
};

export type Volume = {
  id: string;
  yearId: string;
  volumeNumber: number;
  name: string | null;
  quarter: 'Q1' | 'Q2' | 'Q3' | 'Q4' | null;
  startMonth: number | null;
  endMonth: number | null;
};

export type IssueSlot = {
  id: string;
  volumeId: string;
  slotNumber: number;
  month: number | null;
  issueType: 'monthly' | 'weekly';
};

export type Issue = {
  id: string;
  slotId: string | null;
  volumeId: string | null;
  isSpecialEdition: boolean;
  title: string;
  description: string | null;
  language: string;
  posterUrl: string | null;
  softCopyRate: number | null;
  hardCopyRate: number | null;
  bothRate: number | null;
  couponApplicable: boolean;
  status: IssueStatus;
  publishedAt: string | null;
  createdAt: string;
  /** Display-only, populated by listing/detail queries that join through volume/slot. */
  volumeNumber?: number | null;
  slotNumber?: number | null;
  year?: number | null;
};

/** Server-only extension — includes the private storage path. Never send to the client. */
export type IssueWithPdfPath = Issue & { pdfStoragePath: string | null };

export type SubscriptionPlan = {
  id: string;
  name: string;
  format: Format;
  durationMonths: number;
  durationLabel: string;
  price: number;
  couponApplicable: boolean;
  isActive: boolean;
  razorpayPlanId: string | null;
};

export type Subscription = {
  id: string;
  userId: string;
  planId: string;
  format: Format;
  startDate: string;
  endDate: string;
  amountPaid: number;
  couponId: string | null;
  couponDiscount: number;
  razorpayOrderId: string | null;
  razorpayPaymentId: string | null;
  razorpaySubId: string | null;
  status: SubscriptionStatus;
  autoRenew: boolean;
  createdAt: string;
};

export type IssueOrder = {
  id: string;
  userId: string;
  issueId: string;
  format: Format;
  amount: number;
  couponId: string | null;
  couponDiscount: number;
  razorpayOrderId: string | null;
  razorpayPaymentId: string | null;
  deliveryName: string | null;
  deliveryAddress: string | null;
  deliveryCity: string | null;
  deliveryState: string | null;
  deliveryPincode: string | null;
  deliveryPhone: string | null;
  orderStatus: OrderStatus;
  paymentStatus: PaymentStatus;
  createdAt: string;
};

export type ReturnRequest = {
  id: string;
  orderId: string;
  userId: string;
  reason: string;
  adminAction: ReturnAction | null;
  adminNote: string | null;
  refundAmount: number | null;
  razorpayRefundId: string | null;
  status: ReturnStatus;
  createdAt: string;
  actionedAt: string | null;
};

export type Coupon = {
  id: string;
  code: string;
  discountType: DiscountType;
  discountValue: number;
  subscriptionUsageType: CouponUsageType | null;
  expiryDate: string | null;
  isActive: boolean;
};

export type ArticleSubmission = {
  id: string;
  userId: string;
  title: string;
  description: string | null;
  language: string;
  status: SubmissionStatus;
  adminNote: string | null;
  createdAt: string;
  updatedAt: string;
};

export type SubmissionVersion = {
  id: string;
  submissionId: string;
  versionNumber: number;
  wordPath: string;
  pdfPath: string;
  submittedBy: 'user' | 'admin';
  isAdminEdit: boolean;
  createdAt: string;
};

export type SessionUser = { userId: string; email: string; role: Role };
