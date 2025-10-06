import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { TrendingUp, DollarSign, Users, Award, Copy, ExternalLink, LogOut } from "lucide-react";
import { useNavigate, Link } from "react-router-dom";

interface Affiliate {
  code: string;
  name: string;
  username: string;
  commission: number;
  cascade_commission: number;
  tier: string;
  total_leads: number;
  total_sales: number;
  total_earnings: number;
  pending_earnings: number;
  cascade_earnings: number;
  referrals_count: number;
}

interface SubAffiliate {
  code: string;
  name: string;
  username: string;
  total_leads: number;
  total_sales: number;
  total_earnings: number;
}

interface Lead {
  id: string;
  ticket_id: string;
  transaction_value: number;
  affiliate_commission: number;
  status: string;
  created_at: string;
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

const AffiliateDashboard = () => {
  const { profile, signOut } = useAuth();
  const [affiliate, setAffiliate] = useState<Affiliate | null>(null);
  const [subAffiliates, setSubAffiliates] = useState<SubAffiliate[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    if (!profile?.affiliate_code) {
      toast({
        title: "Código de afiliado não encontrado",
        description: "Entre em contato com o administrador",
        variant: "destructive"
      });
      return;
    }

    fetchData();
  }, [profile]);

  const fetchData = async () => {
    if (!profile?.affiliate_code) return;

    try {
      // Fetch affiliate data
      const { data: affiliateData, error: affiliateError } = await supabase
        .from("affiliates")
        .select("*")
        .eq("code", profile.affiliate_code)
        .single();

      if (affiliateError) throw affiliateError;
      setAffiliate(affiliateData);

      // Fetch sub-affiliates
      const { data: subAffiliatesData, error: subAffiliatesError } = await supabase
        .from("affiliates")
        .select("code, name, username, total_leads, total_sales, total_earnings")
        .eq("referred_by", profile.affiliate_code);

      if (subAffiliatesError) throw subAffiliatesError;
      setSubAffiliates(subAffiliatesData || []);

      // Fetch leads
      const { data: leadsData, error: leadsError } = await supabase
        .from("leads")
        .select("*")
        .eq("affiliate_code", profile.affiliate_code)
        .order("created_at", { ascending: false })
        .limit(10);

      if (leadsError) throw leadsError;
      setLeads(leadsData || []);
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

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copiado!",
      description: "Código copiado para a área de transferência"
    });
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/auth");
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
        <Card className="max-w-md mx-auto p-8 text-center">
          <h2 className="text-2xl font-bold mb-4">Afiliado não encontrado</h2>
          <Button onClick={handleSignOut}>Sair</Button>
        </Card>
      </div>
    );
  }

  const conversionRate = affiliate.total_leads > 0
    ? ((affiliate.total_sales / affiliate.total_leads) * 100).toFixed(1)
    : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <div className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-primary via-purple-500 to-cyan-500 bg-clip-text text-transparent">
              Meu Dashboard
            </h1>
            <p className="text-muted-foreground">Bem-vindo, {affiliate.name}</p>
          </div>
          <Button variant="ghost" onClick={handleSignOut}>
            <LogOut className="mr-2 h-4 w-4" />
            Sair
          </Button>
        </div>

        {/* Affiliate Code Card */}
        <Card className="p-6 border-primary/20">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h2 className="text-3xl font-bold text-primary">{affiliate.code}</h2>
                <Badge className={getTierColor(affiliate.tier)}>
                  {getTierEmoji(affiliate.tier)} {affiliate.tier.toUpperCase()}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                Seu código de afiliado • {affiliate.commission}% de comissão
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => copyToClipboard(affiliate.code)}
              >
                <Copy className="mr-2 h-4 w-4" />
                Copiar Código
              </Button>
              <Link to={`/affiliate/${affiliate.code}`}>
                <Button variant="outline">
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Ver Detalhes
                </Button>
              </Link>
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
            <p className="text-sm text-muted-foreground">Leads Gerados</p>
          </Card>

          <Card className="p-6 border-green-500/20">
            <div className="flex items-center justify-between mb-2">
              <Award className="h-5 w-5 text-green-500" />
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

          <Card className="p-6 border-purple-500/20">
            <div className="flex items-center justify-between mb-2">
              <Users className="h-5 w-5 text-purple-500" />
              <span className="text-2xl font-bold text-purple-500">{affiliate.referrals_count}</span>
            </div>
            <p className="text-sm text-muted-foreground">Sub-Afiliados</p>
          </Card>
        </div>

        {/* Additional Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="p-6 border-primary/20">
            <h3 className="text-lg font-semibold mb-4">📊 Performance</h3>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm text-muted-foreground">Taxa de Conversão</span>
                  <span className="font-bold">{conversionRate}%</span>
                </div>
                <Progress value={Number(conversionRate)} className="h-2" />
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Ganhos Pendentes</span>
                <span className="font-bold text-yellow-500">
                  R$ {affiliate.pending_earnings.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Ganhos de Cascata</span>
                <span className="font-bold text-purple-500">
                  R$ {affiliate.cascade_earnings.toFixed(2)}
                </span>
              </div>
            </div>
          </Card>

          {/* Sub-Affiliates */}
          <Card className="p-6 border-primary/20">
            <h3 className="text-lg font-semibold mb-4">👥 Meus Sub-Afiliados ({subAffiliates.length})</h3>
            {subAffiliates.length === 0 ? (
              <p className="text-center text-muted-foreground py-4">
                Nenhum sub-afiliado ainda
              </p>
            ) : (
              <div className="space-y-2 max-h-[200px] overflow-y-auto">
                {subAffiliates.map((sub) => (
                  <div
                    key={sub.code}
                    className="flex items-center justify-between p-3 bg-card/50 rounded-lg border border-border"
                  >
                    <div>
                      <p className="font-semibold">{sub.code}</p>
                      <p className="text-xs text-muted-foreground">{sub.name}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-green-500">{sub.total_sales} vendas</p>
                      <p className="text-xs text-muted-foreground">{sub.total_leads} leads</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        {/* Recent Leads */}
        <Card className="p-6 border-primary/20">
          <h3 className="text-lg font-semibold mb-4">📝 Leads Recentes</h3>
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

export default AffiliateDashboard;
