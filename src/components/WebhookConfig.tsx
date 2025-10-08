import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Bell, TestTube } from "lucide-react";

interface WebhookConfigProps {
  affiliateCode: string;
  currentWebhookUrl: string | null;
}

export const WebhookConfig = ({ affiliateCode, currentWebhookUrl }: WebhookConfigProps) => {
  const [webhookUrl, setWebhookUrl] = useState(currentWebhookUrl || "");
  const [loading, setLoading] = useState(false);
  const [testing, setTesting] = useState(false);
  const { toast } = useToast();

  const handleSave = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.functions.invoke("update-affiliate", {
        body: {
          code: affiliateCode,
          discord_webhook_url: webhookUrl || null,
        },
      });

      if (error) throw error;

      toast({
        title: "Webhook atualizada!",
        description: "Sua URL de webhook foi salva com sucesso.",
      });
    } catch (error) {
      console.error("Error updating webhook:", error);
      toast({
        title: "Erro",
        description: "Não foi possível salvar a webhook.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleTest = async () => {
    if (!webhookUrl) {
      toast({
        title: "Aviso",
        description: "Digite uma URL de webhook primeiro.",
        variant: "destructive",
      });
      return;
    }

    setTesting(true);
    try {
      const testPayload = {
        embeds: [{
          title: "🧪 TESTE DE WEBHOOK",
          description: "Esta é uma mensagem de teste da sua webhook pessoal!",
          color: 0x00ff00,
          fields: [
            { name: "Código do Afiliado", value: affiliateCode, inline: true },
            { name: "Status", value: "Webhook funcionando!", inline: true },
          ],
          timestamp: new Date().toISOString()
        }]
      };

      const response = await fetch(webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(testPayload),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      toast({
        title: "Teste enviado!",
        description: "Verifique seu Discord para a mensagem de teste.",
      });
    } catch (error) {
      console.error("Error testing webhook:", error);
      toast({
        title: "Erro no teste",
        description: "Não foi possível enviar a mensagem de teste. Verifique a URL.",
        variant: "destructive",
      });
    } finally {
      setTesting(false);
    }
  };

  return (
    <Card className="border-primary/20">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Bell className="h-5 w-5 text-primary" />
          <CardTitle>Notificações de Saque</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="webhook">URL da Webhook do Discord</Label>
          <Input
            id="webhook"
            type="url"
            placeholder="https://discord.com/api/webhooks/..."
            value={webhookUrl}
            onChange={(e) => setWebhookUrl(e.target.value)}
            className="border-primary/20"
          />
          <p className="text-xs text-muted-foreground">
            Configure uma webhook pessoal para receber notificações sobre suas solicitações de saque.
          </p>
        </div>

        <div className="flex gap-2">
          <Button onClick={handleSave} disabled={loading} className="flex-1">
            {loading ? "Salvando..." : "Salvar Webhook"}
          </Button>
          <Button
            onClick={handleTest}
            disabled={testing || !webhookUrl}
            variant="outline"
            className="gap-2"
          >
            <TestTube className="h-4 w-4" />
            {testing ? "Enviando..." : "Testar"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
