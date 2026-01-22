-- Add promo period configuration to platform_config
INSERT INTO public.platform_config (key, value) 
VALUES 
  ('promo_enabled', '{"enabled": false}'),
  ('promo_duration_months', '{"months": 0}')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;