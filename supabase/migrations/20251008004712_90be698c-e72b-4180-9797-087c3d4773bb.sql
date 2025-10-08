-- Create a simple admin config table
CREATE TABLE public.admin_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  discord_id TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.admin_config ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Anyone can read admin config"
ON public.admin_config
FOR SELECT
USING (true);

CREATE POLICY "Service role can manage admin config"
ON public.admin_config
FOR ALL
USING (true)
WITH CHECK (true);

-- Insert default admin (use seu Discord ID real aqui)
INSERT INTO public.admin_config (discord_id, name)
VALUES ('ADMIN_123456789', 'Admin Principal');