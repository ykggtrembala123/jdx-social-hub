-- Add is_active column to affiliates table to support soft delete
ALTER TABLE public.affiliates 
ADD COLUMN is_active boolean NOT NULL DEFAULT true;

-- Create index for better performance on active affiliates queries
CREATE INDEX idx_affiliates_is_active ON public.affiliates(is_active);

-- Add webhook_url to system_config for admin management
INSERT INTO public.system_config (key, value, description)
VALUES ('discord_webhook_url', 0, 'Discord Webhook URL for notifications (stored as text in notes)')
ON CONFLICT (key) DO NOTHING;

-- Add notes column to system_config to store text values like webhook URL
ALTER TABLE public.system_config 
ADD COLUMN IF NOT EXISTS notes text;