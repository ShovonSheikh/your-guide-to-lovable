import { supabase } from "@/integrations/supabase/client";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const DUMMY_PAYMENTS = (import.meta.env.VITE_DUMMY_PAYMENTS as string) === "true";

interface CheckoutParams {
  fullname: string;
  email: string;
  amount?: number;
  reference_id?: string;
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

export async function createCheckout(params: CheckoutParams): Promise<CheckoutResponse> {
  const successUrl = `${window.location.origin}/payment/success`;
  const cancelUrl = `${window.location.origin}/payment/cancel`;

  if (DUMMY_PAYMENTS) {
    const txn = `dummy_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const amount = params.amount || 10;
    const url = `${successUrl}?transactionId=${encodeURIComponent(txn)}&paymentMethod=Dummy&paymentAmount=${encodeURIComponent(
      amount
    )}`;
    return { payment_url: url };
  }

  const { data, error } = await supabase.functions.invoke('rupantor-checkout', {
    body: {
      fullname: params.fullname,
      email: params.email,
      amount: params.amount || 10,
      successUrl,
      cancelUrl,
      reference_id: params.reference_id,
    },
  });

  if (error) {
    console.error("Checkout error:", error);
    return { error: error.message };
  }

  return data;
}

export async function verifyPayment(params: VerifyParams): Promise<VerifyResponse> {
  if (DUMMY_PAYMENTS) {
    return {
      verified: true,
      transaction_id: params.transaction_id,
      status: 'COMPLETED',
      amount: params.payment_amount ? String(params.payment_amount) : '10',
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
  if (DUMMY_PAYMENTS) {
    return {
      success: true,
      username: profileData.username,
      active_until: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
      billing_start: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
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
