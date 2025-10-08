import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { withdrawalId, status, notes } = await req.json();

    if (!withdrawalId || !status) {
      return new Response(
        JSON.stringify({ error: "ID da solicitação e status são obrigatórios" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!["pending", "approved", "completed", "rejected"].includes(status)) {
      return new Response(
        JSON.stringify({ error: "Status inválido" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Get withdrawal request details
    const { data: withdrawal, error: fetchError } = await supabase
      .from("withdrawal_requests")
      .select("*, affiliates!inner(*)")
      .eq("id", withdrawalId)
      .single();

    if (fetchError || !withdrawal) {
      console.error("Error fetching withdrawal:", fetchError);
      return new Response(
        JSON.stringify({ error: "Solicitação de saque não encontrada" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Update withdrawal status
    const updateData: any = { status };
    if (notes) updateData.notes = notes;
    if (status === "completed") updateData.processed_at = new Date().toISOString();

    const { data: updatedWithdrawal, error: updateError } = await supabase
      .from("withdrawal_requests")
      .update(updateData)
      .eq("id", withdrawalId)
      .select()
      .single();

    if (updateError) {
      console.error("Error updating withdrawal:", updateError);
      return new Response(
        JSON.stringify({ error: "Erro ao atualizar status" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Send Discord notification to affiliate
    try {
      const webhookUrl = Deno.env.get("DISCORD_WEBHOOK_URL");
      if (webhookUrl) {
        const affiliate = withdrawal.affiliates;
        let statusText = "";
        let color = 0x808080;

        switch (status) {
          case "completed":
            statusText = "✅ SAQUE APROVADO E PAGO";
            color = 0x00ff00;
            break;
          case "rejected":
            statusText = "❌ SAQUE REJEITADO";
            color = 0xff0000;
            break;
          case "approved":
            statusText = "⏳ SAQUE APROVADO (Processando)";
            color = 0xffaa00;
            break;
        }

        const webhookPayload = {
          embeds: [{
            title: statusText,
            color: color,
            fields: [
              { name: "Afiliado", value: `${affiliate.name} (@${affiliate.username})`, inline: true },
              { name: "Código", value: affiliate.code, inline: true },
              { name: "Valor", value: `R$ ${withdrawal.amount.toFixed(2)}`, inline: true },
              { name: "Método", value: withdrawal.payment_method === "pix" ? "PIX" : "Crypto", inline: true },
              { name: "Endereço/Chave", value: withdrawal.payment_address, inline: false },
            ],
            timestamp: new Date().toISOString()
          }]
        };

        if (notes) {
          webhookPayload.embeds[0].fields.push({
            name: "Observações",
            value: notes,
            inline: false
          });
        }

        await fetch(webhookUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(webhookPayload)
        });
      }
    } catch (webhookError) {
      console.error("Error sending Discord notification:", webhookError);
      // Don't fail the request if webhook fails
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Status atualizado com sucesso!",
        withdrawal: updatedWithdrawal 
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Erro desconhecido" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
