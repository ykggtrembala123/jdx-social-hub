import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, DollarSign, CheckCircle, XCircle } from "lucide-react";

interface WithdrawalRequest {
  id: string;
  affiliate_code: string;
  amount: number;
  payment_method: string;
  payment_address: string;
  status: string;
  notes: string | null;
  requested_at: string;
  processed_at: string | null;
  affiliates: {
    name: string;
    username: string;
  };
}

const WithdrawalManagement = () => {
  const [withdrawals, setWithdrawals] = useState<WithdrawalRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const { adminData } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (!adminData) {
      navigate("/auth");
      return;
    }
    fetchWithdrawals();
  }, [adminData, navigate]);

  const fetchWithdrawals = async () => {
    try {
      const { data, error } = await supabase
        .from("withdrawal_requests")
        .select(`
          *,
          affiliates!inner(name, username)
        `)
        .order("requested_at", { ascending: false });

      if (error) throw error;
      setWithdrawals(data || []);
    } catch (error) {
      console.error("Error fetching withdrawals:", error);
      toast({
        title: "Erro",
        description: "Erro ao carregar solicitações de saque",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (withdrawalId: string, newStatus: string) => {
    setProcessingId(withdrawalId);
    try {
      const { error } = await supabase.functions.invoke("update-withdrawal-status", {
        body: {
          withdrawalId,
          status: newStatus,
          notes: notes[withdrawalId] || null,
        },
      });

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Status atualizado com sucesso!",
      });

      await fetchWithdrawals();
      setNotes((prev) => {
        const newNotes = { ...prev };
        delete newNotes[withdrawalId];
        return newNotes;
      });
    } catch (error) {
      console.error("Error updating status:", error);
      toast({
        title: "Erro",
        description: "Erro ao atualizar status",
        variant: "destructive",
      });
    } finally {
      setProcessingId(null);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      pending: "outline",
      approved: "secondary",
      completed: "default",
      rejected: "destructive",
    };

    const labels: Record<string, string> = {
      pending: "Pendente",
      approved: "Aprovado",
      completed: "Pago",
      rejected: "Rejeitado",
    };

    return <Badge variant={variants[status] || "outline"}>{labels[status] || status}</Badge>;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando solicitações...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <Button variant="ghost" onClick={() => navigate("/admin")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar
          </Button>
          <h1 className="text-4xl font-bold">Gerenciar Saques</h1>
        </div>

        <div className="grid gap-4">
          {withdrawals.length === 0 ? (
            <Card>
              <CardContent className="pt-6 text-center text-muted-foreground">
                Nenhuma solicitação de saque encontrada
              </CardContent>
            </Card>
          ) : (
            withdrawals.map((withdrawal) => (
              <Card key={withdrawal.id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-xl">
                        {withdrawal.affiliates.name} (@{withdrawal.affiliates.username})
                      </CardTitle>
                      <p className="text-sm text-muted-foreground">
                        Código: {withdrawal.affiliate_code}
                      </p>
                    </div>
                    {getStatusBadge(withdrawal.status)}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Valor</p>
                      <p className="text-lg font-semibold text-primary">
                        R$ {withdrawal.amount.toFixed(2)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Método</p>
                      <p className="font-medium">
                        {withdrawal.payment_method === "pix" ? "PIX" : "Crypto"}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Solicitado em</p>
                      <p className="text-sm">
                        {new Date(withdrawal.requested_at).toLocaleDateString("pt-BR")}
                      </p>
                    </div>
                    {withdrawal.processed_at && (
                      <div>
                        <p className="text-sm text-muted-foreground">Processado em</p>
                        <p className="text-sm">
                          {new Date(withdrawal.processed_at).toLocaleDateString("pt-BR")}
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="mb-4">
                    <p className="text-sm text-muted-foreground mb-1">
                      Endereço/Chave de Pagamento
                    </p>
                    <p className="font-mono text-sm bg-muted p-2 rounded">
                      {withdrawal.payment_address}
                    </p>
                  </div>

                  {withdrawal.notes && (
                    <div className="mb-4">
                      <p className="text-sm text-muted-foreground mb-1">Observações</p>
                      <p className="text-sm bg-muted p-2 rounded">{withdrawal.notes}</p>
                    </div>
                  )}

                  {withdrawal.status === "pending" && (
                    <div className="space-y-3">
                      <Textarea
                        placeholder="Observações (opcional)"
                        value={notes[withdrawal.id] || ""}
                        onChange={(e) =>
                          setNotes((prev) => ({ ...prev, [withdrawal.id]: e.target.value }))
                        }
                      />
                      <div className="flex gap-2">
                        <Button
                          onClick={() => updateStatus(withdrawal.id, "completed")}
                          disabled={processingId === withdrawal.id}
                          className="flex-1"
                        >
                          <CheckCircle className="mr-2 h-4 w-4" />
                          Marcar como Pago
                        </Button>
                        <Button
                          variant="destructive"
                          onClick={() => updateStatus(withdrawal.id, "rejected")}
                          disabled={processingId === withdrawal.id}
                          className="flex-1"
                        >
                          <XCircle className="mr-2 h-4 w-4" />
                          Rejeitar
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default WithdrawalManagement;
