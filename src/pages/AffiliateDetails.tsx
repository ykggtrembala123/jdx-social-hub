import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ArrowLeft, TrendingUp, DollarSign, Users, Calendar, Wallet, Receipt } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Affiliate {
  id: string;
  code: string;
  name: string;
  username: string;
  user_id: string;
  commission: number;
  cascade_commission: number;
  tier: string;
  referred_by: string | null;
  created_at: string;
  total_leads: number;
  total_sales: number;
  total_earnings: number;
  pending_earnings: number;
  cascade_earnings: number;
  referrals_count: number;
}

interface Lead {
  id: string;
  ticket_id: string;
  transaction_value: number;
  fee_percentage: number;
  affiliate_commission: number;
  status: string;
  created_at: string;
  confirmed_at: string | null;
}

interface WithdrawalRequest {
  id: string;
  amount: number;
  payment_method: string;
  payment_address: string;
  status: string;
  requested_at: string;
  processed_at: string | null;
  notes: string | null;
}

const getTierEmoji = (tier: string) => {
  const emojis: Record<string, string> = {
    bronze: "🥉",
    prata: "🥈",
    ouro: "🥇",
    diamante: "💎"
  };
  return emojis[tier] || "🥈";
};

const getTierColor = (tier: string) => {
  const colors: Record<string, string> = {
    bronze: "bg-orange-500/10 text-orange-500 border-orange-500/20",
    prata: "bg-slate-500/10 text-slate-400 border-slate-500/20",
    ouro: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
    diamante: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20"
  };
  return colors[tier] || colors.prata;
};

const AffiliateDetails = () => {
  const { code } = useParams<{ code: string }>();
  const [affiliate, setAffiliate] = useState<Affiliate | null>(null);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [withdrawals, setWithdrawals] = useState<WithdrawalRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [withdrawalDialogOpen, setWithdrawalDialogOpen] = useState(false);
  const [withdrawalAmount, setWithdrawalAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("pix");
  const [paymentAddress, setPaymentAddress] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data: affiliateData, error: affiliateError } = await supabase
          .from("affiliates")
          .select("*")
          .eq("code", code?.toUpperCase())
          .single();

        if (affiliateError) throw affiliateError;
        setAffiliate(affiliateData);

        const { data: leadsData, error: leadsError } = await supabase
          .from("leads")
          .select("*")
          .eq("affiliate_code", code?.toUpperCase())
          .order("created_at", { ascending: false });

        if (leadsError) throw leadsError;
        setLeads(leadsData || []);

        const { data: withdrawalsData, error: withdrawalsError } = await supabase
          .from("withdrawal_requests")
          .select("*")
          .eq("affiliate_code", code?.toUpperCase())
          .order("requested_at", { ascending: false });

        if (withdrawalsError) throw withdrawalsError;
        setWithdrawals(withdrawalsData || []);
      } catch (error: any) {
        toast({
          title: "Erro ao carregar dados",
          description: error.message,
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };

    if (code) fetchData();
  }, [code, toast]);

  const handleWithdrawalRequest = async () => {
    if (!affiliate) return;

    const amount = parseFloat(withdrawalAmount);
    if (isNaN(amount) || amount <= 0) {
      toast({
        title: "Valor inválido",
        description: "Por favor, insira um valor válido",
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

    setSubmitting(true);
    try {
      const { data, error } = await supabase.functions.invoke("request-withdrawal", {
        body: {
          affiliateCode: affiliate.code,
          amount,
          paymentMethod,
          paymentAddress
        }
      });

      if (error) throw error;

      toast({
        title: "Solicitação enviada!",
        description: "Sua solicitação de saque foi enviada com sucesso. Você será notificado no Discord."
      });

      setWithdrawalDialogOpen(false);
      setWithdrawalAmount("");
      setPaymentAddress("");
      
      // Refresh withdrawals
      const { data: withdrawalsData } = await supabase
        .from("withdrawal_requests")
        .select("*")
        .eq("affiliate_code", affiliate.code)
        .order("requested_at", { ascending: false });
      
      if (withdrawalsData) setWithdrawals(withdrawalsData);
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!affiliate) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 p-6">
        <div className="container mx-auto max-w-4xl">
          <Card className="p-12 text-center">
            <h2 className="text-2xl font-bold mb-4">Afiliado não encontrado</h2>
            <Link to="/">
              <Button>Voltar para Home</Button>
            </Link>
          </Card>
        </div>
      </div>
    );
  }

  const conversionRate =
    affiliate.total_leads > 0
      ? ((affiliate.total_sales / affiliate.total_leads) * 100).toFixed(1)
      : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 p-6">
      <div className="container mx-auto max-w-6xl space-y-6">
        <Link to="/">
          <Button variant="ghost">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar
          </Button>
        </Link>

        {/* Header Card */}
        <Card className="p-8 border-primary/20">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-4xl font-bold text-primary">{affiliate.code}</h1>
                <Badge className={getTierColor(affiliate.tier)}>
                  {getTierEmoji(affiliate.tier)} {affiliate.tier.toUpperCase()}
                </Badge>
              </div>
              <p className="text-xl text-muted-foreground">{affiliate.name}</p>
              <p className="text-sm text-muted-foreground">@{affiliate.username}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Comissão</p>
              <p className="text-3xl font-bold text-purple-500">{affiliate.commission}%</p>
              <p className="text-xs text-muted-foreground">do lucro</p>
            </div>
          </div>
        </Card>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="p-6 border-primary/20">
            <div className="flex items-center justify-between mb-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              <span className="text-2xl font-bold">{affiliate.total_leads}</span>
            </div>
            <p className="text-sm text-muted-foreground">Total de Leads</p>
          </Card>

          <Card className="p-6 border-green-500/20">
            <div className="flex items-center justify-between mb-2">
              <Users className="h-5 w-5 text-green-500" />
              <span className="text-2xl font-bold text-green-500">{affiliate.total_sales}</span>
            </div>
            <p className="text-sm text-muted-foreground">Vendas Confirmadas</p>
          </Card>

          <Card className="p-6 border-cyan-500/20">
            <div className="flex items-center justify-between mb-2">
              <DollarSign className="h-5 w-5 text-cyan-500" />
              <span className="text-2xl font-bold text-cyan-500">
                R$ {affiliate.total_earnings.toFixed(2)}
              </span>
            </div>
            <p className="text-sm text-muted-foreground">Total Ganho</p>
          </Card>

          <Card className="p-6 border-yellow-500/20">
            <div className="flex items-center justify-between mb-2">
              <Calendar className="h-5 w-5 text-yellow-500" />
              <span className="text-2xl font-bold text-yellow-500">
                R$ {affiliate.pending_earnings.toFixed(2)}
              </span>
            </div>
            <p className="text-sm text-muted-foreground">Ganhos Pendentes</p>
          </Card>
        </div>

        {/* Withdrawal Section */}
        <Card className="p-6 border-primary/20">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Wallet className="h-5 w-5 text-purple-500" />
              Solicitar Saque
            </h3>
            <Dialog open={withdrawalDialogOpen} onOpenChange={setWithdrawalDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-purple-500 hover:bg-purple-600">
                  💰 Sacar Ganhos
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
                      R$ {affiliate.total_earnings.toFixed(2)}
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
                      step="0.01"
                    />
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
          </div>
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              • Saldo disponível: <span className="font-bold text-purple-500">R$ {affiliate.total_earnings.toFixed(2)}</span>
            </p>
            <p className="text-sm text-muted-foreground">
              • Ganhos pendentes: <span className="font-bold text-yellow-500">R$ {affiliate.pending_earnings.toFixed(2)}</span>
            </p>
          </div>
        </Card>

        {/* Withdrawal History */}
        {withdrawals.length > 0 && (
          <Card className="p-6 border-primary/20">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Receipt className="h-5 w-5 text-cyan-500" />
              Histórico de Saques
            </h3>
            <div className="space-y-3">
              {withdrawals.map((withdrawal) => (
                <div
                  key={withdrawal.id}
                  className="flex items-center justify-between p-4 bg-card/50 rounded-lg border border-border"
                >
                  <div>
                    <p className="font-bold">R$ {withdrawal.amount.toFixed(2)}</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(withdrawal.requested_at).toLocaleDateString("pt-BR")}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {withdrawal.payment_method === "pix" ? "PIX" : "Crypto"}: {withdrawal.payment_address}
                    </p>
                  </div>
                  <Badge
                    variant={
                      withdrawal.status === "completed" ? "default" :
                      withdrawal.status === "rejected" ? "destructive" :
                      "secondary"
                    }
                  >
                    {withdrawal.status === "completed" ? "✅ Pago" :
                     withdrawal.status === "rejected" ? "❌ Rejeitado" :
                     withdrawal.status === "approved" ? "✓ Aprovado" :
                     "⏳ Pendente"}
                  </Badge>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Additional Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="p-6 border-purple-500/20">
            <h3 className="text-lg font-semibold mb-4">📊 Informações Adicionais</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Taxa de Conversão</span>
                <span className="font-bold">{conversionRate}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Ganhos Cascata</span>
                <span className="font-bold text-purple-500">
                  R$ {affiliate.cascade_earnings.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Afiliados Indicados</span>
                <span className="font-bold">{affiliate.referrals_count}</span>
              </div>
              {affiliate.referred_by && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Indicado Por</span>
                  <Link to={`/affiliate/${affiliate.referred_by}`}>
                    <span className="font-bold text-primary hover:underline">
                      {affiliate.referred_by}
                    </span>
                  </Link>
                </div>
              )}
            </div>
          </Card>

          <Card className="p-6 border-primary/20">
            <h3 className="text-lg font-semibold mb-4">📅 Cadastro</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Data de Criação</span>
                <span className="font-bold">
                  {new Date(affiliate.created_at).toLocaleDateString("pt-BR")}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Discord ID</span>
                <span className="font-mono text-sm">{affiliate.user_id}</span>
              </div>
            </div>
          </Card>
        </div>

        {/* Leads History */}
        <Card className="p-6 border-primary/20">
          <h3 className="text-lg font-semibold mb-4">📝 Histórico de Leads</h3>
          {leads.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              Nenhum lead registrado ainda
            </p>
          ) : (
            <div className="space-y-3">
              {leads.map((lead) => (
                <div
                  key={lead.id}
                  className="flex items-center justify-between p-4 bg-card/50 rounded-lg border border-border"
                >
                  <div>
                    <p className="font-mono font-semibold">{lead.ticket_id}</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(lead.created_at).toLocaleDateString("pt-BR")}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-cyan-500">
                      R$ {lead.affiliate_commission.toFixed(2)}
                    </p>
                    <Badge
                      variant={lead.status === "confirmed" ? "default" : "secondary"}
                      className="mt-1"
                    >
                      {lead.status === "confirmed" ? "✅ Confirmado" : "⏳ Pendente"}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};

export default AffiliateDetails;
