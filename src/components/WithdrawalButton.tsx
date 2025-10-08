import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Wallet } from "lucide-react";

interface WithdrawalButtonProps {
  affiliateCode: string;
  totalEarnings: number;
  onSuccess?: () => void;
}

export const WithdrawalButton = ({ affiliateCode, totalEarnings, onSuccess }: WithdrawalButtonProps) => {
  const [open, setOpen] = useState(false);
  const [withdrawalAmount, setWithdrawalAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("pix");
  const [paymentAddress, setPaymentAddress] = useState("");
  const [cryptoCoin, setCryptoCoin] = useState("");
  const [cryptoNetwork, setCryptoNetwork] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();

  const handleWithdrawalRequest = async () => {
    const amount = parseFloat(withdrawalAmount);
    
    if (isNaN(amount) || amount <= 0) {
      toast({
        title: "Valor inválido",
        description: "Por favor, insira um valor válido",
        variant: "destructive"
      });
      return;
    }

    if (amount > totalEarnings) {
      toast({
        title: "Saldo insuficiente",
        description: `Você só pode sacar até R$ ${totalEarnings.toFixed(2)}`,
        variant: "destructive"
      });
      return;
    }

    if (!paymentAddress) {
      toast({
        title: "Endereço obrigatório",
        description: "Por favor, insira sua chave PIX ou endereço crypto",
        variant: "destructive"
      });
      return;
    }

    if (paymentMethod === "crypto" && (!cryptoCoin || !cryptoNetwork)) {
      toast({
        title: "Dados incompletos",
        description: "Por favor, informe a moeda e a rede para pagamento em crypto",
        variant: "destructive"
      });
      return;
    }

    setSubmitting(true);
    try {
      const { error } = await supabase.functions.invoke("request-withdrawal", {
        body: {
          affiliateCode,
          amount,
          paymentMethod,
          paymentAddress,
          cryptoCoin: paymentMethod === "crypto" ? cryptoCoin : null,
          cryptoNetwork: paymentMethod === "crypto" ? cryptoNetwork : null
        }
      });

      if (error) throw error;

      toast({
        title: "Solicitação enviada!",
        description: "Sua solicitação de saque foi enviada com sucesso. Você será notificado no Discord."
      });

      setOpen(false);
      setWithdrawalAmount("");
      setPaymentAddress("");
      setCryptoCoin("");
      setCryptoNetwork("");
      
      if (onSuccess) onSuccess();
    } catch (error: any) {
      toast({
        title: "Erro ao solicitar saque",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-purple-500 hover:bg-purple-600 gap-2">
          <Wallet className="h-4 w-4" />
          Sacar Ganhos
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Solicitar Saque</DialogTitle>
          <DialogDescription>
            Preencha os dados para solicitar o saque dos seus ganhos. Você será notificado no Discord.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Saldo Disponível</Label>
            <p className="text-2xl font-bold text-purple-500">
              R$ {totalEarnings.toFixed(2)}
            </p>
          </div>
          <div>
            <Label htmlFor="amount">Valor do Saque</Label>
            <Input
              id="amount"
              type="number"
              placeholder="0.00"
              value={withdrawalAmount}
              onChange={(e) => setWithdrawalAmount(e.target.value)}
              min="0"
              max={totalEarnings}
              step="0.01"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Máximo: R$ {totalEarnings.toFixed(2)}
            </p>
          </div>
          <div>
            <Label htmlFor="payment-method">Método de Pagamento</Label>
            <Select value={paymentMethod} onValueChange={setPaymentMethod}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pix">PIX</SelectItem>
                <SelectItem value="crypto">Crypto</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="payment-address">
              {paymentMethod === "pix" ? "Chave PIX" : "Endereço Crypto"}
            </Label>
            <Input
              id="payment-address"
              placeholder={paymentMethod === "pix" ? "email@exemplo.com ou telefone" : "0x..."}
              value={paymentAddress}
              onChange={(e) => setPaymentAddress(e.target.value)}
            />
          </div>
          {paymentMethod === "crypto" && (
            <>
              <div>
                <Label htmlFor="crypto-coin">Moeda</Label>
                <Select value={cryptoCoin} onValueChange={setCryptoCoin}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a moeda" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="BTC">Bitcoin (BTC)</SelectItem>
                    <SelectItem value="ETH">Ethereum (ETH)</SelectItem>
                    <SelectItem value="USDT">Tether (USDT)</SelectItem>
                    <SelectItem value="USDC">USD Coin (USDC)</SelectItem>
                    <SelectItem value="BNB">Binance Coin (BNB)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="crypto-network">Rede</Label>
                <Select value={cryptoNetwork} onValueChange={setCryptoNetwork}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a rede" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ERC20">Ethereum (ERC20)</SelectItem>
                    <SelectItem value="TRC20">Tron (TRC20)</SelectItem>
                    <SelectItem value="BEP20">BSC (BEP20)</SelectItem>
                    <SelectItem value="BTC">Bitcoin Network</SelectItem>
                    <SelectItem value="SOL">Solana</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </>
          )}
          <Button 
            onClick={handleWithdrawalRequest} 
            disabled={submitting}
            className="w-full"
          >
            {submitting ? "Enviando..." : "Solicitar Saque"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
