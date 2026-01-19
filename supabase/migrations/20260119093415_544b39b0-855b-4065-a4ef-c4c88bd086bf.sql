-- Fix search path for the new function
ALTER FUNCTION check_withdrawal_amount() SET search_path = public;