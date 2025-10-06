-- Create system_config table for dynamic configurations
CREATE TABLE public.system_config (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  key TEXT NOT NULL UNIQUE,
  value NUMERIC NOT NULL,
  description TEXT,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.system_config ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Anyone can read system config"
ON public.system_config
FOR SELECT
USING (true);

CREATE POLICY "Service role can update system config"
ON public.system_config
FOR UPDATE
USING (true);

-- Insert default configurations
INSERT INTO public.system_config (key, value, description) VALUES
  ('default_affiliate_commission', 30, 'Comissão padrão do afiliado (%)'),
  ('default_cascade_commission', 5, 'Comissão padrão de cascata (%) - FIXO'),
  ('min_transaction_fee', 5, 'Taxa mínima de transação (%)'),
  ('max_transaction_fee', 20, 'Taxa máxima de transação (%)'),
  ('bronze_commission', 30, 'Comissão tier Bronze (%)'),
  ('prata_commission', 30, 'Comissão tier Prata (%)'),
  ('ouro_commission', 40, 'Comissão tier Ouro (%)'),
  ('diamante_commission', 50, 'Comissão tier Diamante (%)');

-- Create profiles table for user authentication
CREATE TABLE public.profiles (
  id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  discord_id TEXT UNIQUE,
  discord_username TEXT,
  avatar_url TEXT,
  role TEXT NOT NULL DEFAULT 'affiliate', -- affiliate or admin
  affiliate_code TEXT REFERENCES public.affiliates(code),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "Users can read own profile"
ON public.profiles
FOR SELECT
USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
ON public.profiles
FOR UPDATE
USING (auth.uid() = id);

CREATE POLICY "Service role can insert profiles"
ON public.profiles
FOR INSERT
WITH CHECK (true);

-- Create trigger to update updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_system_config_updated_at
BEFORE UPDATE ON public.system_config
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();