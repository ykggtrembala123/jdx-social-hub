import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Plus, TrendingUp, Users, DollarSign, Award, LogOut, Settings } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

interface Affiliate {
  id: string;
  code: string;
  name: string;
  username: string;
  commission: number;
  tier: string;
  total_leads: number;
  total_sales: number;
  total_earnings: number;
  pending_earnings: number;
  cascade_earnings: number;
  referrals_count: number;
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

const AdminDashboard = () => {
  const [affiliates, setAffiliates] = useState<Affiliate[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const navigate = useNavigate();

  const fetchAffiliates = async () => {
    try {
      const { data, error } = await supabase
        .from("affiliates")
        .select("*")
        .order("total_earnings", { ascending: false });

      if (error) throw error;
      setAffiliates(data || []);
    } catch (error: any) {
      toast({
        title: "Erro ao carregar afiliados",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAffiliates();

    const channel = supabase
      .channel("affiliates-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "affiliates"
        },
        () => fetchAffiliates()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const filteredAffiliates = affiliates.filter(
    (aff) =>
      aff.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      aff.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalStats = affiliates.reduce(
    (acc, aff) => ({
      leads: acc.leads + aff.total_leads,
      sales: acc.sales + aff.total_sales,
      earnings: acc.earnings + aff.total_earnings
    }),
    { leads: 0, sales: 0, earnings: 0 }
  );

  const handleSignOut = () => {
    navigate("/auth");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <div className="container mx-auto p-6 space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="text-center flex-1 space-y-4 py-8">
            <h1 className="text-5xl font-bold bg-gradient-to-r from-primary via-purple-500 to-cyan-500 bg-clip-text text-transparent">
              Dashboard Administrativo
            </h1>
            <p className="text-lg text-muted-foreground">
              Gerencie seus afiliados e acompanhe as comissões
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" onClick={handleSignOut}>
              <LogOut className="mr-2 h-4 w-4" />
              Sair
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="p-6 border-primary/20 bg-gradient-to-br from-card to-primary/5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total de Afiliados</p>
                <h3 className="text-3xl font-bold text-primary">{affiliates.length}</h3>
              </div>
              <Users className="h-12 w-12 text-primary/50" />
            </div>
          </Card>

          <Card className="p-6 border-purple-500/20 bg-gradient-to-br from-card to-purple-500/5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total de Leads</p>
                <h3 className="text-3xl font-bold text-purple-500">{totalStats.leads}</h3>
              </div>
              <TrendingUp className="h-12 w-12 text-purple-500/50" />
            </div>
          </Card>

          <Card className="p-6 border-cyan-500/20 bg-gradient-to-br from-card to-cyan-500/5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Ganho</p>
                <h3 className="text-3xl font-bold text-cyan-500">
                  R$ {totalStats.earnings.toFixed(2)}
                </h3>
              </div>
              <DollarSign className="h-12 w-12 text-cyan-500/50" />
            </div>
          </Card>
        </div>

        {/* Search & Actions */}
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
          <Input
            placeholder="Buscar por código ou nome..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-md border-primary/20"
          />
          <Link to="/create-affiliate">
            <Button className="bg-gradient-to-r from-primary to-purple-500 hover:opacity-90">
              <Plus className="mr-2 h-4 w-4" />
              Criar Afiliado
            </Button>
          </Link>
        </div>

        {/* Affiliates Grid */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          </div>
        ) : filteredAffiliates.length === 0 ? (
          <Card className="p-12 text-center border-dashed">
            <Award className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">Nenhum afiliado encontrado</h3>
            <p className="text-muted-foreground mb-6">
              Comece criando seu primeiro afiliado
            </p>
            <Link to="/create-affiliate">
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Criar Primeiro Afiliado
              </Button>
            </Link>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredAffiliates.map((affiliate) => (
              <Link key={affiliate.id} to={`/affiliate/${affiliate.code}`}>
                <Card className="p-6 hover:border-primary/50 transition-all hover:shadow-lg hover:shadow-primary/10 cursor-pointer border-primary/20">
                  <div className="space-y-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="text-2xl font-bold text-primary">{affiliate.code}</h3>
                        <p className="text-sm text-muted-foreground">{affiliate.name}</p>
                      </div>
                      <Badge className={getTierColor(affiliate.tier)}>
                        {getTierEmoji(affiliate.tier)} {affiliate.tier.toUpperCase()}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border">
                      <div>
                        <p className="text-xs text-muted-foreground">Leads</p>
                        <p className="text-lg font-bold">{affiliate.total_leads}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Vendas</p>
                        <p className="text-lg font-bold text-green-500">
                          {affiliate.total_sales}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Comissão</p>
                        <p className="text-lg font-bold text-purple-500">
                          {affiliate.commission}%
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Ganhos</p>
                        <p className="text-lg font-bold text-cyan-500">
                          R$ {affiliate.total_earnings.toFixed(2)}
                        </p>
                      </div>
                    </div>

                    {affiliate.pending_earnings > 0 && (
                      <div className="pt-2 border-t border-border">
                        <p className="text-xs text-muted-foreground">Pendente</p>
                        <p className="text-sm font-semibold text-yellow-500">
                          R$ {affiliate.pending_earnings.toFixed(2)}
                        </p>
                      </div>
                    )}
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
