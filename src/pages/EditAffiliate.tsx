import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Save } from "lucide-react";

interface Affiliate {
  code: string;
  name: string;
  username: string;
  commission: number;
  cascade_commission: number;
  tier: string;
  referred_by: string | null;
  discord_user_id: string | null;
}

const EditAffiliate = () => {
  const { code } = useParams<{ code: string }>();
  const [affiliate, setAffiliate] = useState<Affiliate | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { adminData } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (!adminData) {
      navigate("/auth");
      return;
    }
    fetchAffiliate();
  }, [adminData, code, navigate]);

  const fetchAffiliate = async () => {
    try {
      const { data, error } = await supabase
        .from("affiliates")
        .select("*")
        .eq("code", code)
        .single();

      if (error) throw error;
      setAffiliate(data);
    } catch (error) {
      console.error("Error fetching affiliate:", error);
      toast({
        title: "Erro",
        description: "Erro ao carregar dados do afiliado",
        variant: "destructive",
      });
      navigate("/admin");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!affiliate) return;

    setSaving(true);
    try {
      const { error } = await supabase.functions.invoke("update-affiliate", {
        body: {
          code: affiliate.code,
          name: affiliate.name,
          username: affiliate.username,
          commission: affiliate.commission,
          cascade_commission: affiliate.cascade_commission,
          tier: affiliate.tier,
          referred_by: affiliate.referred_by || null,
          discord_user_id: affiliate.discord_user_id || null,
        },
      });

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Afiliado atualizado com sucesso!",
      });

      navigate(`/affiliate/${affiliate.code}`);
    } catch (error) {
      console.error("Error updating affiliate:", error);
      toast({
        title: "Erro",
        description: "Erro ao atualizar afiliado",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!affiliate) return null;

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <Button variant="ghost" onClick={() => navigate(`/affiliate/${code}`)}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar
          </Button>
          <h1 className="text-4xl font-bold">Editar Afiliado</h1>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Dados do Afiliado</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="code">Código (não editável)</Label>
                <Input id="code" value={affiliate.code} disabled />
              </div>

              <div>
                <Label htmlFor="name">Nome</Label>
                <Input
                  id="name"
                  value={affiliate.name}
                  onChange={(e) => setAffiliate({ ...affiliate, name: e.target.value })}
                  required
                />
              </div>

              <div>
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  value={affiliate.username}
                  onChange={(e) => setAffiliate({ ...affiliate, username: e.target.value })}
                  required
                />
              </div>

              <div>
                <Label htmlFor="discord_user_id">Discord User ID</Label>
                <Input
                  id="discord_user_id"
                  value={affiliate.discord_user_id || ""}
                  onChange={(e) =>
                    setAffiliate({ ...affiliate, discord_user_id: e.target.value || null })
                  }
                  placeholder="ID do Discord (opcional)"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="commission">Comissão (%)</Label>
                  <Input
                    id="commission"
                    type="number"
                    min="0"
                    max="100"
                    step="0.01"
                    value={affiliate.commission}
                    onChange={(e) =>
                      setAffiliate({ ...affiliate, commission: parseFloat(e.target.value) })
                    }
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="cascade_commission">Comissão Cascata (%)</Label>
                  <Input
                    id="cascade_commission"
                    type="number"
                    min="0"
                    max="100"
                    step="0.01"
                    value={affiliate.cascade_commission}
                    onChange={(e) =>
                      setAffiliate({
                        ...affiliate,
                        cascade_commission: parseFloat(e.target.value),
                      })
                    }
                    required
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="tier">Tier</Label>
                <Select
                  value={affiliate.tier}
                  onValueChange={(value) => setAffiliate({ ...affiliate, tier: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="bronze">Bronze</SelectItem>
                    <SelectItem value="prata">Prata</SelectItem>
                    <SelectItem value="ouro">Ouro</SelectItem>
                    <SelectItem value="diamante">Diamante</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="referred_by">Código do Referenciador (opcional)</Label>
                <Input
                  id="referred_by"
                  value={affiliate.referred_by || ""}
                  onChange={(e) =>
                    setAffiliate({ ...affiliate, referred_by: e.target.value || null })
                  }
                  placeholder="Código de quem indicou este afiliado"
                />
              </div>

              <div className="flex gap-2">
                <Button type="submit" disabled={saving} className="flex-1">
                  <Save className="mr-2 h-4 w-4" />
                  {saving ? "Salvando..." : "Salvar Alterações"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate(`/affiliate/${code}`)}
                  disabled={saving}
                >
                  Cancelar
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default EditAffiliate;
