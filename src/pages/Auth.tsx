import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sparkles, Hash } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const Auth = () => {
  const [discordId, setDiscordId] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('get-affiliate-by-discord-id', {
        body: { discord_user_id: discordId }
      });

      if (error) throw error;

      if (data && data.affiliate) {
        // Armazena os dados do afiliado no localStorage
        localStorage.setItem('affiliate_data', JSON.stringify(data.affiliate));
        toast({
          title: "Login realizado!",
          description: `Bem-vindo, ${data.affiliate.name}!`
        });
        navigate("/dashboard");
      } else {
        toast({
          title: "Discord ID não encontrado",
          description: "Nenhum afiliado encontrado com este Discord ID.",
          variant: "destructive"
        });
      }
    } catch (error: any) {
      console.error('Error logging in:', error);
      toast({
        title: "Erro ao fazer login",
        description: error.message || "Tente novamente mais tarde.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center p-6">
      <Card className="w-full max-w-md p-8 border-primary/20">
        <div className="text-center mb-8">
          <div className="inline-block p-3 bg-primary/10 rounded-full mb-4">
            <Sparkles className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary via-purple-500 to-cyan-500 bg-clip-text text-transparent">
            Vultos Swap
          </h1>
          <p className="text-muted-foreground mt-2">Dashboard de Afiliados</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="discord-id" className="flex items-center gap-2">
              <Hash className="h-4 w-4" />
              Discord ID
            </Label>
            <Input
              id="discord-id"
              type="text"
              placeholder="Seu Discord ID"
              value={discordId}
              onChange={(e) => setDiscordId(e.target.value)}
              required
              className="border-primary/20"
            />
          </div>
          <Button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-primary to-purple-500 hover:opacity-90"
          >
            {loading ? "Verificando..." : "Acessar Dashboard"}
          </Button>
        </form>
      </Card>
    </div>
  );
};

export default Auth;
