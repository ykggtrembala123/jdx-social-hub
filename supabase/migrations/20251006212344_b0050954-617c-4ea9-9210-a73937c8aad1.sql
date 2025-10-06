-- Add discord_user_id to affiliates table
ALTER TABLE public.affiliates 
ADD COLUMN discord_user_id TEXT UNIQUE;

-- Add cascade_code to leads table to track which cascade affiliate earned the commission
ALTER TABLE public.leads 
ADD COLUMN cascade_code TEXT;