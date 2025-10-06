-- Create enum for affiliate tiers
CREATE TYPE affiliate_tier AS ENUM ('bronze', 'prata', 'ouro', 'diamante');

-- Create affiliates table
CREATE TABLE public.affiliates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  user_id TEXT NOT NULL,
  username TEXT NOT NULL,
  name TEXT NOT NULL,
  commission DECIMAL NOT NULL DEFAULT 30,
  cascade_commission DECIMAL NOT NULL DEFAULT 10,
  tier affiliate_tier NOT NULL DEFAULT 'prata',
  referred_by TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  total_leads INTEGER NOT NULL DEFAULT 0,
  total_sales INTEGER NOT NULL DEFAULT 0,
  total_earnings DECIMAL NOT NULL DEFAULT 0,
  pending_earnings DECIMAL NOT NULL DEFAULT 0,
  cascade_earnings DECIMAL NOT NULL DEFAULT 0,
  referrals_count INTEGER NOT NULL DEFAULT 0
);

-- Create leads table
CREATE TABLE public.leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id TEXT UNIQUE NOT NULL,
  affiliate_code TEXT NOT NULL,
  client_name TEXT,
  transaction_value DECIMAL NOT NULL,
  fee_percentage DECIMAL NOT NULL,
  total_profit DECIMAL NOT NULL,
  affiliate_commission DECIMAL NOT NULL,
  cascade_commission DECIMAL NOT NULL DEFAULT 0,
  company_profit DECIMAL NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  confirmed_at TIMESTAMPTZ,
  FOREIGN KEY (affiliate_code) REFERENCES affiliates(code) ON DELETE CASCADE
);

-- Enable RLS
ALTER TABLE public.affiliates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

-- Public read access for affiliates (para o bot poder ler)
CREATE POLICY "Anyone can read affiliates"
ON public.affiliates FOR SELECT
USING (true);

-- Public read access for leads
CREATE POLICY "Anyone can read leads"
ON public.leads FOR SELECT
USING (true);

-- Insert/Update policies (apenas admins podem adicionar/editar via API)
CREATE POLICY "Service role can insert affiliates"
ON public.affiliates FOR INSERT
WITH CHECK (true);

CREATE POLICY "Service role can update affiliates"
ON public.affiliates FOR UPDATE
USING (true);

CREATE POLICY "Service role can insert leads"
ON public.leads FOR INSERT
WITH CHECK (true);

CREATE POLICY "Service role can update leads"
ON public.leads FOR UPDATE
USING (true);

-- Create indexes
CREATE INDEX idx_affiliates_code ON public.affiliates(code);
CREATE INDEX idx_affiliates_referred_by ON public.affiliates(referred_by);
CREATE INDEX idx_leads_affiliate_code ON public.leads(affiliate_code);
CREATE INDEX idx_leads_status ON public.leads(status);
CREATE INDEX idx_leads_ticket_id ON public.leads(ticket_id);