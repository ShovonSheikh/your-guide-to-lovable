-- Migration: Cleanup Old Goal Trigger
-- 
-- This migration drops the database trigger that was responsible for goal notifications.
-- We are moving this logic to the Edge Functions to handle it more reliably and add the 25% milestone.
-- 
-- The old trigger relied on the database trigger `update_funding_goal_on_tip` which we are replacing.
-- 

-- Drop the trigger
DROP TRIGGER IF EXISTS trigger_update_funding_goal_on_tip ON public.tips;

-- Drop the function
DROP FUNCTION IF EXISTS public.update_funding_goal_on_tip();
