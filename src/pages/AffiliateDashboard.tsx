import { useAuth } from "@/contexts/AuthContext";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LogOut, Copy, TrendingUp, Users, DollarSign, Target } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { WebhookConfig } from "@/components/WebhookConfig";
import { WithdrawalButton } from "@/components/WithdrawalButton";

const AffiliateDashboard = () => {
  const { affiliateData, signOut } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const { data: leads } = useQuery({
    queryKey: ['leads', affiliateData?.code],
    queryFn: async () => {
      if (!affiliateData?.code) return [];
      
      const { data, error } = await supabase
        .from('leads')
        .select('*')
        .eq('affiliate_code', affiliateData.code)
        .order('created_at', { ascending: false })
        .limit(10);
      
      if (error) throw error;
      return data;
    },
    enabled: !!affiliateData?.code
  });

  const { data: subAffiliates } = useQuery({
    queryKey: ['sub-affiliates', affiliateData?.code],
    queryFn: async () => {
      if (!affiliateData?.code) return [];
      
      const { data, error } = await supabase
        .from('affiliates')
        .select('*')
        .eq('referred_by', affiliateData.code);
      
      if (error) throw error;
      return data;
    },
    enabled: !!affiliateData?.code
  });

  const handleCopyCode = () => {
    if (affiliateData?.code) {
      navigator.clipboard.writeText(affiliateData.code);
      toast({
        title: "Código copiado!",
        description: "Seu código de afiliado foi copiado."
      });
    }
  };

  const handleSignOut = () => {
    signOut();
    navigate("/auth");
  };

  const conversionRate = affiliateData?.total_leads 
    ? ((affiliateData.total_sales / affiliateData.total_leads) * 100).toFixed(1)
    : "0";

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <div className="container mx-auto p-6">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-primary via-purple-500 to-cyan-500 bg-clip-text text-transparent">
              Dashboard - {affiliateData?.name}
            </h1>
            <p className="text-muted-foreground mt-2">
              Seus ganhos e performance
            </p>
          </div>
          <Button onClick={handleSignOut} variant="outline" className="gap-2">
            <LogOut className="h-4 w-4" />
            Sair
          </Button>
        </div>

        {/* Affiliate Info Card */}
        <Card className="p-6 mb-6 border-primary/20">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Seu Código de Afiliado</p>
              <div className="flex items-center gap-2 mt-1">
                <code className="text-2xl font-bold bg-primary/10 px-4 py-2 rounded">
                  {affiliateData?.code}
                </code>
                <Button onClick={handleCopyCode} size="sm" variant="ghost">
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div className="flex gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Tier</p>
                <p className="text-xl font-bold capitalize">{affiliateData?.tier}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Comissão</p>
                <p className="text-xl font-bold">{affiliateData?.commission}%</p>
              </div>
            </div>
          </div>
        </Card>

        {/* Withdrawal Button */}
        <div className="flex justify-center mb-6">
          <WithdrawalButton 
            affiliateCode={affiliateData?.code || ""}
            totalEarnings={affiliateData?.total_earnings || 0}
          />
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="p-6 border-primary/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Ganho</p>
                <p className="text-3xl font-bold text-primary">
                  R$ {(affiliateData?.total_earnings || 0).toFixed(2)}
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-primary" />
            </div>
          </Card>

          <Card className="p-6 border-primary/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Leads Gerados</p>
                <p className="text-3xl font-bold">{affiliateData?.total_leads || 0}</p>
              </div>
              <Target className="h-8 w-8 text-purple-500" />
            </div>
          </Card>

          <Card className="p-6 border-primary/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Vendas Confirmadas</p>
                <p className="text-3xl font-bold">{affiliateData?.total_sales || 0}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-cyan-500" />
            </div>
          </Card>

          <Card className="p-6 border-primary/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Sub-Afiliados</p>
                <p className="text-3xl font-bold">{subAffiliates?.length || 0}</p>
              </div>
              <Users className="h-8 w-8 text-orange-500" />
            </div>
          </Card>
        </div>

        {/* Webhook Configuration */}
        <WebhookConfig 
          affiliateCode={affiliateData?.code || ""} 
          currentWebhookUrl={affiliateData?.discord_webhook_url || null}
        />

        {/* Recent Leads */}
        <Card className="p-6 border-primary/20 mt-6">
          <h2 className="text-xl font-bold mb-4">Leads Recentes</h2>
          <div className="space-y-3">
            {leads && leads.length > 0 ? (
              leads.map((lead) => (
                <div key={lead.id} className="flex justify-between items-center p-4 bg-primary/5 rounded-lg">
                  <div>
                    <p className="font-medium">{lead.client_name || "Cliente"}</p>
                    <p className="text-sm text-muted-foreground">
                      Ticket: {lead.ticket_id}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-primary">
                      R$ {Number(lead.affiliate_commission).toFixed(2)}
                    </p>
                    <p className={`text-sm ${lead.status === 'confirmed' ? 'text-green-500' : 'text-yellow-500'}`}>
                      {lead.status === 'confirmed' ? 'Confirmado' : 'Pendente'}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-muted-foreground text-center py-4">
                Nenhum lead ainda
              </p>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default AffiliateDashboard;
