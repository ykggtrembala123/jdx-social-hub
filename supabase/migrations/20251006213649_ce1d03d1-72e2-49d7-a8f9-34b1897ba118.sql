-- Create withdrawal_requests table
CREATE TABLE public.withdrawal_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  affiliate_code TEXT NOT NULL REFERENCES public.affiliates(code) ON DELETE CASCADE,
  amount NUMERIC NOT NULL,
  payment_method TEXT NOT NULL, -- 'pix' or 'crypto'
  payment_address TEXT NOT NULL, -- PIX key or crypto address
  status TEXT NOT NULL DEFAULT 'pending', -- pending, approved, rejected, completed
  requested_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  processed_at TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  CONSTRAINT positive_amount CHECK (amount > 0)
);

-- Enable RLS
ALTER TABLE public.withdrawal_requests ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Anyone can read withdrawal requests"
ON public.withdrawal_requests
FOR SELECT
USING (true);

CREATE POLICY "Service role can insert withdrawal requests"
ON public.withdrawal_requests
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Service role can update withdrawal requests"
ON public.withdrawal_requests
FOR UPDATE
USING (true);

-- Create new indexes for better performance (skip ones that might exist)
CREATE INDEX IF NOT EXISTS idx_affiliates_discord_user_id ON public.affiliates(discord_user_id);
CREATE INDEX IF NOT EXISTS idx_leads_ticket_id ON public.leads(ticket_id);
CREATE INDEX IF NOT EXISTS idx_leads_status ON public.leads(status);
CREATE INDEX IF NOT EXISTS idx_withdrawal_requests_affiliate_code ON public.withdrawal_requests(affiliate_code);
CREATE INDEX IF NOT EXISTS idx_withdrawal_requests_status ON public.withdrawal_requests(status);