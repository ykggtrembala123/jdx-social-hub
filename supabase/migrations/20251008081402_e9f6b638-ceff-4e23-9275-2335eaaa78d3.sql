-- Criar função para incrementar o contador de referrals
CREATE OR REPLACE FUNCTION public.increment_referrals_count(affiliate_code TEXT)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.affiliates
  SET referrals_count = referrals_count + 1
  WHERE code = affiliate_code;
END;
$$;

-- Criar trigger para atualizar automaticamente o referrals_count quando um novo afiliado é criado
CREATE OR REPLACE FUNCTION public.update_referrer_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.referred_by IS NOT NULL THEN
    UPDATE public.affiliates
    SET referrals_count = referrals_count + 1
    WHERE code = NEW.referred_by;
  END IF;
  RETURN NEW;
END;
$$;

-- Criar trigger na tabela affiliates
DROP TRIGGER IF EXISTS trigger_update_referrer_count ON public.affiliates;
CREATE TRIGGER trigger_update_referrer_count
AFTER INSERT ON public.affiliates
FOR EACH ROW
EXECUTE FUNCTION public.update_referrer_count();