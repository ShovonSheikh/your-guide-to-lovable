import { supabase } from "@/integrations/supabase/client";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

// Cached dummy payments flag - fetched from platform_config DB
let _dummyPaymentsCache: boolean | null = null;
let _dummyCacheExpiry = 0;
const CACHE_TTL_MS = 30_000; // 30 seconds

async function isDummyPayments(): Promise<boolean> {
  const now = Date.now();
  if (_dummyPaymentsCache !== null && now < _dummyCacheExpiry) {
    return _dummyPaymentsCache;
  }

  try {
    const { data } = await supabase
      .from('platform_config')
      .select('value')
      .eq('key', 'dummy_payments')
      .maybeSingle();

    const enabled = !!(data?.value as any)?.enabled;
    _dummyPaymentsCache = enabled;
    _dummyCacheExpiry = now + CACHE_TTL_MS;
    return enabled;
  } catch {
    // Fallback to cached value or false
    return _dummyPaymentsCache ?? false;
  }
}

// Platform fee is always 150 BDT
export const PLATFORM_FEE = 150;

interface CheckoutParams {
  fullname: string;
  email: string;
  amount?: number;
  reference_id?: string;
  payment_type: 'creator_fee' | 'tip';
}

interface CheckoutResponse {
  payment_url?: string;
  error?: string;
}

interface VerifyParams {
  transaction_id: string;
  payment_method?: string;
  payment_amount?: number;
}

interface VerifyResponse {
  verified: boolean;
  transaction_id: string;
  status: string;
  amount?: string;
  payment_method?: string;
  email?: string;
  error?: string;
}

interface ProfileData {
  transaction_id: string;
  username: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  bio: string;
  category: string;
  twitter?: string;
  instagram?: string;
  youtube?: string;
  other_link?: string;
  payout_method?: string;
  phone?: string;
}

interface CompleteSignupResponse {
  success: boolean;
  username?: string;
  active_until?: string;
  billing_start?: string;
  error?: string;
}

// Helper to get success/cancel URLs based on payment type
function getPaymentUrls(paymentType: 'creator_fee' | 'tip') {
  const base = window.location.origin;
  if (paymentType === 'creator_fee') {
    return {
      successUrl: `${base}/payments/creator/success`,
      cancelUrl: `${base}/payments/creator/failed`,
    };
  }
  return {
    successUrl: `${base}/payments/tips/success`,
    cancelUrl: `${base}/payments/tips/failed`,
  };
}

/**
 * Create checkout for creator account fee payment
 * Always uses PLATFORM_FEE (150 BDT)
 */
export async function createCreatorCheckout(params: {
  fullname: string;
  email: string;
  reference_id?: string;
}): Promise<CheckoutResponse> {
  const { successUrl, cancelUrl } = getPaymentUrls('creator_fee');

  if (await isDummyPayments()) {
    const txn = `dummy_creator_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const url = `${successUrl}?transactionId=${encodeURIComponent(txn)}&paymentMethod=Dummy&paymentAmount=${PLATFORM_FEE}`;
    return { payment_url: url };
  }

  const { data, error } = await supabase.functions.invoke('rupantor-checkout', {
    body: {
      fullname: params.fullname,
      email: params.email,
      amount: PLATFORM_FEE, // Always fixed
      successUrl,
      cancelUrl,
      reference_id: params.reference_id,
      payment_type: 'creator_fee',
    },
  });

  if (error) {
    console.error("Creator checkout error:", error);
    return { error: error.message };
  }

  return data;
}

/**
 * Create checkout for tip payment
 */
export async function createTipCheckout(params: {
  fullname: string;
  email: string;
  amount: number;
  creator_id?: string;
}): Promise<CheckoutResponse> {
  const { successUrl, cancelUrl } = getPaymentUrls('tip');

  if (await isDummyPayments()) {
    const txn = `dummy_tip_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const url = `${successUrl}?transactionId=${encodeURIComponent(txn)}&paymentMethod=Dummy&paymentAmount=${params.amount}`;
    return { payment_url: url };
  }

  const { data, error } = await supabase.functions.invoke('rupantor-checkout', {
    body: {
      fullname: params.fullname,
      email: params.email,
      amount: params.amount,
      successUrl,
      cancelUrl,
      payment_type: 'tip',
      creator_id: params.creator_id,
    },
  });

  if (error) {
    console.error("Tip checkout error:", error);
    return { error: error.message };
  }

  return data;
}

/**
 * @deprecated Use createCreatorCheckout or createTipCheckout instead
 */
export async function createCheckout(params: {
  fullname: string;
  email: string;
  amount?: number;
  reference_id?: string;
}): Promise<CheckoutResponse> {
  // Determine payment type based on amount
  if (params.amount === PLATFORM_FEE || !params.amount) {
    return createCreatorCheckout({
      fullname: params.fullname,
      email: params.email,
      reference_id: params.reference_id,
    });
  }
  return createTipCheckout({
    fullname: params.fullname,
    email: params.email,
    amount: params.amount,
  });
}

export async function verifyPayment(params: VerifyParams): Promise<VerifyResponse> {
  if (await isDummyPayments()) {
    return {
      verified: true,
      transaction_id: params.transaction_id,
      status: 'COMPLETED',
      amount: params.payment_amount ? String(params.payment_amount) : String(PLATFORM_FEE),
      payment_method: params.payment_method || 'Dummy',
      email: '',
    };
  }

  const { data, error } = await supabase.functions.invoke('rupantor-verify', {
    body: params,
  });

  if (error) {
    console.error("Verify error:", error);
    return { 
      verified: false, 
      transaction_id: params.transaction_id,
      status: 'ERROR',
      error: error.message 
    };
  }

  return data;
}

export async function completeSignup(profileData: ProfileData): Promise<CompleteSignupResponse> {
  if (await isDummyPayments()) {
    return {
      success: true,
      username: profileData.username,
      active_until: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      billing_start: new Date().toISOString(),
    };
  }

  const { data, error } = await supabase.functions.invoke('complete-signup', {
    body: profileData,
  });

  if (error) {
    console.error("Complete signup error:", error);
    return { success: false, error: error.message };
  }

  return data;
}
