import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, UserPlus } from "lucide-react";
import { Link } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

const CreateAffiliate = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    code: "",
    user_id: "",
    username: "",
    name: "",
    commission: "30",
    tier: "prata" as "bronze" | "prata" | "ouro" | "diamante",
    referred_by: ""
  });

  const tierCommissions: Record<string, number> = {
    bronze: 20,
    prata: 30,
    ouro: 40,
    diamante: 50
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const commission = tierCommissions[formData.tier];
      const referredByCode = formData.referred_by.toUpperCase() || null;

      // Validar se o código de indicação existe
      if (referredByCode) {
        const { data: referrer, error: referrerError } = await supabase
          .from("affiliates")
          .select("*")
          .eq("code", referredByCode)
          .single();

        if (referrerError || !referrer) {
          toast({
            title: "Erro ao criar afiliado",
            description: `O código de indicação ${referredByCode} não existe.`,
            variant: "destructive"
          });
          setLoading(false);
          return;
        }
      }

      const { error } = await supabase.from("affiliates").insert([
        {
          code: formData.code.toUpperCase(),
          user_id: formData.user_id,
          username: formData.username,
          name: formData.name,
          commission,
          tier: formData.tier,
          referred_by: referredByCode
        }
      ]);

      if (error) throw error;

      // O trigger automático já incrementa o referrals_count

      toast({
        title: "Afiliado criado com sucesso!",
        description: `O código ${formData.code.toUpperCase()} foi cadastrado.`
      });

      navigate("/");
    } catch (error: any) {
      toast({
        title: "Erro ao criar afiliado",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 p-6">
      <div className="container mx-auto max-w-2xl space-y-6">
        <Button variant="ghost" className="mb-4" onClick={() => navigate("/admin")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar
        </Button>

        <Card className="p-8 border-primary/20">
          <div className="flex items-center gap-3 mb-6">
            <UserPlus className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold">Criar Novo Afiliado</h1>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="code">Código do Afiliado *</Label>
              <Input
                id="code"
                required
                placeholder="EX: JOAO123"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                className="border-primary/20"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="name">Nome Completo *</Label>
              <Input
                id="name"
                required
                placeholder="João Silva"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="border-primary/20"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="user_id">Discord User ID *</Label>
              <Input
                id="user_id"
                required
                placeholder="123456789012345678"
                value={formData.user_id}
                onChange={(e) => setFormData({ ...formData, user_id: e.target.value })}
                className="border-primary/20"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="username">Discord Username *</Label>
              <Input
                id="username"
                required
                placeholder="@joaosilva"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                className="border-primary/20"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="tier">Tier *</Label>
              <Select value={formData.tier} onValueChange={(value) => setFormData({ ...formData, tier: value as "bronze" | "prata" | "ouro" | "diamante" })}>
                <SelectTrigger className="border-primary/20">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="bronze">🥉 Bronze (20% do lucro)</SelectItem>
                  <SelectItem value="prata">🥈 Prata (30% do lucro)</SelectItem>
                  <SelectItem value="ouro">🥇 Ouro (40% do lucro)</SelectItem>
                  <SelectItem value="diamante">💎 Diamante (50% do lucro)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="referred_by">Indicado Por (Opcional)</Label>
              <Input
                id="referred_by"
                placeholder="Código de quem indicou"
                value={formData.referred_by}
                onChange={(e) => setFormData({ ...formData, referred_by: e.target.value.toUpperCase() })}
                className="border-primary/20"
              />
              <p className="text-xs text-muted-foreground">
                Se este afiliado foi indicado por outro, informe o código do indicador
              </p>
            </div>

            <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
              <h3 className="font-semibold mb-2">📊 Comissão Selecionada</h3>
              <p className="text-2xl font-bold text-primary">
                {tierCommissions[formData.tier]}% do lucro
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                Exemplo: Lucro de R$ 100 = Comissão de R$ {tierCommissions[formData.tier]}
              </p>
            </div>

            <Button type="submit" disabled={loading} className="w-full bg-gradient-to-r from-primary to-purple-500">
              {loading ? "Criando..." : "Criar Afiliado"}
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
};

export default CreateAffiliate;
