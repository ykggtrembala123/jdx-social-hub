-- Add crypto fields to withdrawal_requests table
ALTER TABLE public.withdrawal_requests 
ADD COLUMN crypto_coin text,
ADD COLUMN crypto_network text;