-- Create trigger function to send emails for goal milestone notifications
CREATE OR REPLACE FUNCTION public.send_goal_milestone_email()
RETURNS TRIGGER AS $$
DECLARE
  service_role_key TEXT;
  supabase_url TEXT;
BEGIN
  -- Only trigger for goal milestone notifications
  IF NEW.type IN ('goal_milestone_50', 'goal_milestone_75', 'goal_milestone_100') THEN
    -- Get config
    service_role_key := current_setting('app.supabase_service_role_key', true);
    supabase_url := 'https://wwrkisbnpsmbkofqgndq.supabase.co';
    
    -- Call edge function via pg_net
    PERFORM net.http_post(
      url := supabase_url || '/functions/v1/send-email-notification',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || service_role_key
      ),
      body := jsonb_build_object(
        'profile_id', NEW.profile_id::text,
        'email', NEW.data->>'email',
        'type', NEW.type,
        'data', jsonb_build_object(
          'goal_title', NEW.data->>'goal_title',
          'milestone', (NEW.data->>'milestone')::int,
          'current_amount', (NEW.data->>'current_amount')::numeric,
          'target_amount', (NEW.data->>'target_amount')::numeric,
          'percentage', (NEW.data->>'percentage')::numeric,
          'first_name', NEW.data->>'first_name'
        )
      )::text
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger for goal milestone email notifications
DROP TRIGGER IF EXISTS send_goal_milestone_email_trigger ON public.notifications;
CREATE TRIGGER send_goal_milestone_email_trigger
  AFTER INSERT ON public.notifications
  FOR EACH ROW
  EXECUTE FUNCTION public.send_goal_milestone_email();