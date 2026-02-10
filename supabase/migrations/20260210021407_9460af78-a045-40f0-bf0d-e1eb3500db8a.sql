
-- ============================================
-- PART 1: outbound_emails table for Mailbox Backend
-- ============================================

CREATE TABLE public.outbound_emails (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  mailbox_id uuid NOT NULL REFERENCES public.mailboxes(id),
  to_addresses text NOT NULL,
  cc_addresses text,
  bcc_addresses text,
  subject text NOT NULL DEFAULT '',
  html_body text,
  text_body text,
  status text NOT NULL DEFAULT 'draft',
  is_deleted boolean NOT NULL DEFAULT false,
  scheduled_at timestamp with time zone,
  sent_at timestamp with time zone,
  resend_id text,
  in_reply_to text,
  created_by uuid REFERENCES public.profiles(id),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_outbound_emails_mailbox_status ON public.outbound_emails (mailbox_id, status, is_deleted);
CREATE INDEX idx_outbound_emails_created_by ON public.outbound_emails (created_by);

-- Trigger for updated_at
CREATE TRIGGER update_outbound_emails_updated_at
  BEFORE UPDATE ON public.outbound_emails
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- RLS
ALTER TABLE public.outbound_emails ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view outbound emails"
  ON public.outbound_emails FOR SELECT
  USING (is_admin());

CREATE POLICY "Admins can insert outbound emails"
  ON public.outbound_emails FOR INSERT
  WITH CHECK (is_admin());

CREATE POLICY "Admins can update outbound emails"
  ON public.outbound_emails FOR UPDATE
  USING (is_admin());

CREATE POLICY "Admins can delete outbound emails"
  ON public.outbound_emails FOR DELETE
  USING (is_admin());

-- ============================================
-- PART 2: Token Economy Tables
-- ============================================

-- token_balances
CREATE TABLE public.token_balances (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id uuid NOT NULL UNIQUE REFERENCES public.profiles(id),
  balance numeric NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TRIGGER update_token_balances_updated_at
  BEFORE UPDATE ON public.token_balances
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.token_balances ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own token balance"
  ON public.token_balances FOR SELECT
  USING (profile_id IN (
    SELECT profiles.id FROM profiles
    WHERE profiles.user_id = ((current_setting('request.headers'::text, true))::json ->> 'x-clerk-user-id'::text)
  ));

CREATE POLICY "Admins can view all token balances"
  ON public.token_balances FOR SELECT
  USING (is_admin());

-- token_transactions
CREATE TABLE public.token_transactions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id uuid NOT NULL REFERENCES public.profiles(id),
  type text NOT NULL,
  amount numeric NOT NULL,
  balance_before numeric NOT NULL DEFAULT 0,
  balance_after numeric NOT NULL DEFAULT 0,
  reference_id text,
  description text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX idx_token_transactions_profile ON public.token_transactions (profile_id, created_at DESC);
CREATE INDEX idx_token_transactions_type ON public.token_transactions (profile_id, type);
CREATE INDEX idx_token_transactions_ref ON public.token_transactions (reference_id);

ALTER TABLE public.token_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own token transactions"
  ON public.token_transactions FOR SELECT
  USING (profile_id IN (
    SELECT profiles.id FROM profiles
    WHERE profiles.user_id = ((current_setting('request.headers'::text, true))::json ->> 'x-clerk-user-id'::text)
  ));

CREATE POLICY "Admins can view all token transactions"
  ON public.token_transactions FOR SELECT
  USING (is_admin());

-- ============================================
-- PART 3: Token Economy RPC Functions
-- ============================================

-- process_token_deposit: Credits tokens after successful payment
CREATE OR REPLACE FUNCTION public.process_token_deposit(
  p_profile_id uuid,
  p_amount numeric,
  p_reference_id text DEFAULT NULL,
  p_description text DEFAULT 'Token deposit'
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  current_bal numeric;
  new_bal numeric;
BEGIN
  IF p_amount <= 0 THEN
    RETURN jsonb_build_object('success', false, 'error', 'Amount must be positive');
  END IF;

  -- Upsert token_balances
  INSERT INTO token_balances (profile_id, balance)
  VALUES (p_profile_id, p_amount)
  ON CONFLICT (profile_id) DO UPDATE
  SET balance = token_balances.balance + p_amount, updated_at = now()
  RETURNING balance - p_amount, balance INTO current_bal, new_bal;

  -- If it was an insert, current_bal will be wrong, fix it
  IF current_bal IS NULL THEN
    current_bal := 0;
    new_bal := p_amount;
  END IF;

  -- Record transaction
  INSERT INTO token_transactions (profile_id, type, amount, balance_before, balance_after, reference_id, description)
  VALUES (p_profile_id, 'deposit', p_amount, current_bal, new_bal, p_reference_id, p_description);

  RETURN jsonb_build_object('success', true, 'new_balance', new_bal);
END;
$$;

-- process_token_transfer: Atomic tip transfer between supporter and creator
CREATE OR REPLACE FUNCTION public.process_token_transfer(
  p_sender_profile_id uuid,
  p_receiver_profile_id uuid,
  p_amount numeric,
  p_reference_id text DEFAULT NULL,
  p_description text DEFAULT 'Token tip'
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  sender_bal numeric;
  sender_new_bal numeric;
  receiver_bal numeric;
  receiver_new_bal numeric;
BEGIN
  IF p_amount <= 0 THEN
    RETURN jsonb_build_object('success', false, 'error', 'Amount must be positive');
  END IF;

  IF p_sender_profile_id = p_receiver_profile_id THEN
    RETURN jsonb_build_object('success', false, 'error', 'Cannot transfer to yourself');
  END IF;

  -- Lock sender row
  SELECT balance INTO sender_bal
  FROM token_balances
  WHERE profile_id = p_sender_profile_id
  FOR UPDATE;

  IF sender_bal IS NULL OR sender_bal < p_amount THEN
    RETURN jsonb_build_object('success', false, 'error', 'Insufficient balance', 'balance', COALESCE(sender_bal, 0));
  END IF;

  -- Deduct from sender
  UPDATE token_balances SET balance = balance - p_amount, updated_at = now()
  WHERE profile_id = p_sender_profile_id
  RETURNING balance INTO sender_new_bal;

  -- Credit receiver (upsert)
  INSERT INTO token_balances (profile_id, balance)
  VALUES (p_receiver_profile_id, p_amount)
  ON CONFLICT (profile_id) DO UPDATE
  SET balance = token_balances.balance + p_amount, updated_at = now()
  RETURNING balance INTO receiver_new_bal;

  receiver_bal := receiver_new_bal - p_amount;

  -- Record both transactions
  INSERT INTO token_transactions (profile_id, type, amount, balance_before, balance_after, reference_id, description)
  VALUES
    (p_sender_profile_id, 'tip_sent', -p_amount, sender_bal, sender_new_bal, p_reference_id, p_description),
    (p_receiver_profile_id, 'tip_received', p_amount, receiver_bal, receiver_new_bal, p_reference_id, p_description);

  RETURN jsonb_build_object('success', true, 'sender_balance', sender_new_bal, 'receiver_balance', receiver_new_bal);
END;
$$;

-- process_token_withdrawal: Deducts tokens when withdrawal is approved
CREATE OR REPLACE FUNCTION public.process_token_withdrawal(
  p_profile_id uuid,
  p_amount numeric,
  p_reference_id text DEFAULT NULL,
  p_description text DEFAULT 'Token withdrawal'
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  current_bal numeric;
  new_bal numeric;
BEGIN
  IF p_amount <= 0 THEN
    RETURN jsonb_build_object('success', false, 'error', 'Amount must be positive');
  END IF;

  -- Lock row
  SELECT balance INTO current_bal
  FROM token_balances
  WHERE profile_id = p_profile_id
  FOR UPDATE;

  IF current_bal IS NULL OR current_bal < p_amount THEN
    RETURN jsonb_build_object('success', false, 'error', 'Insufficient balance', 'balance', COALESCE(current_bal, 0));
  END IF;

  UPDATE token_balances SET balance = balance - p_amount, updated_at = now()
  WHERE profile_id = p_profile_id
  RETURNING balance INTO new_bal;

  INSERT INTO token_transactions (profile_id, type, amount, balance_before, balance_after, reference_id, description)
  VALUES (p_profile_id, 'withdrawal', -p_amount, current_bal, new_bal, p_reference_id, p_description);

  RETURN jsonb_build_object('success', true, 'new_balance', new_bal);
END;
$$;
