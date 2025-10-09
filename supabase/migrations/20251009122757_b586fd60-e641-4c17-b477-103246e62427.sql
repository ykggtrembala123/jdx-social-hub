-- Criar tabela para armazenar códigos OTP
CREATE TABLE IF NOT EXISTS public.otp_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  discord_id TEXT NOT NULL,
  code TEXT NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  used BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  attempts INTEGER DEFAULT 0
);

-- Habilitar RLS
ALTER TABLE public.otp_codes ENABLE ROW LEVEL SECURITY;

-- Policy: Service role pode gerenciar OTP codes
CREATE POLICY "Service role can manage otp codes"
ON public.otp_codes
FOR ALL
USING (true)
WITH CHECK (true);

-- Índice para melhorar performance nas buscas
CREATE INDEX idx_otp_codes_discord_id ON public.otp_codes(discord_id);
CREATE INDEX idx_otp_codes_expires_at ON public.otp_codes(expires_at);

-- Função para limpar OTPs expirados automaticamente
CREATE OR REPLACE FUNCTION public.cleanup_expired_otps()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.otp_codes 
  WHERE expires_at < now() OR (used = true AND created_at < now() - interval '1 hour');
END;
$$;