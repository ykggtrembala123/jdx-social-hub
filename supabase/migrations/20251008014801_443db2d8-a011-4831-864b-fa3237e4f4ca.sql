-- Add discord_webhook_url column to affiliates table
ALTER TABLE public.affiliates
ADD COLUMN IF NOT EXISTS discord_webhook_url TEXT;

COMMENT ON COLUMN public.affiliates.discord_webhook_url IS 'URL da webhook pessoal do Discord do afiliado para notificações de saque';