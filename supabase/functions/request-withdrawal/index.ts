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
    const { affiliateCode, amount, paymentMethod, paymentAddress, cryptoCoin, cryptoNetwork } = await req.json();

    if (!affiliateCode || !amount || !paymentMethod || !paymentAddress) {
      return new Response(
        JSON.stringify({ error: "Todos os campos são obrigatórios" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (paymentMethod === "crypto" && (!cryptoCoin || !cryptoNetwork)) {
      return new Response(
        JSON.stringify({ error: "Moeda e rede são obrigatórios para pagamento em crypto" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (amount <= 0) {
      return new Response(
        JSON.stringify({ error: "O valor deve ser maior que zero" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Get affiliate
    const { data: affiliate, error: affiliateError } = await supabase
      .from("affiliates")
      .select("*")
      .eq("code", affiliateCode)
      .single();

    if (affiliateError || !affiliate) {
      console.error("Error fetching affiliate:", affiliateError);
      return new Response(
        JSON.stringify({ error: "Afiliado não encontrado" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if affiliate has enough balance
    if (affiliate.total_earnings < amount) {
      return new Response(
        JSON.stringify({ 
          error: "Saldo insuficiente",
          available: affiliate.total_earnings,
          requested: amount
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create withdrawal request
    const { data: withdrawal, error: withdrawalError } = await supabase
      .from("withdrawal_requests")
      .insert({
        affiliate_code: affiliateCode,
        amount,
        payment_method: paymentMethod,
        payment_address: paymentAddress,
        crypto_coin: cryptoCoin || null,
        crypto_network: cryptoNetwork || null,
        status: "pending"
      })
      .select()
      .single();

    if (withdrawalError) {
      console.error("Error creating withdrawal request:", withdrawalError);
      return new Response(
        JSON.stringify({ error: "Erro ao criar solicitação de saque" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Send Discord webhook notification
    try {
      const webhookUrl = Deno.env.get("DISCORD_WEBHOOK_URL");
      if (webhookUrl) {
        const fields = [
          { name: "Afiliado", value: `${affiliate.name} (@${affiliate.username})`, inline: true },
          { name: "Código", value: affiliate.code, inline: true },
          { name: "Valor", value: `R$ ${amount.toFixed(2)}`, inline: true },
          { name: "Método", value: paymentMethod === "pix" ? "PIX" : "Crypto", inline: true }
        ];

        if (paymentMethod === "crypto") {
          fields.push(
            { name: "Moeda", value: cryptoCoin, inline: true },
            { name: "Rede", value: cryptoNetwork, inline: true },
            { name: "Endereço Crypto", value: paymentAddress, inline: false }
          );
        } else {
          fields.push({ name: "Chave PIX", value: paymentAddress, inline: false });
        }

        fields.push(
          { name: "Total de Ganhos", value: `R$ ${affiliate.total_earnings.toFixed(2)}`, inline: true },
          { name: "Total de Vendas", value: affiliate.total_sales.toString(), inline: true },
          { name: "Total de Leads", value: affiliate.total_leads.toString(), inline: true },
          { name: "Sub-afiliados", value: affiliate.referrals_count.toString(), inline: true },
          { name: "Ganhos em Cascata", value: `R$ ${affiliate.cascade_earnings.toFixed(2)}`, inline: true },
          { name: "Tier", value: affiliate.tier.toUpperCase(), inline: true }
        );

        const webhookPayload = {
          embeds: [{
            title: "💰 Nova Solicitação de Saque",
            color: 0x00ff00,
            fields,
            timestamp: new Date().toISOString()
          }]
        };

        await fetch(webhookUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(webhookPayload)
        });
      }
    } catch (webhookError) {
      console.error("Error sending Discord webhook:", webhookError);
      // Don't fail the request if webhook fails
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Solicitação de saque criada com sucesso!",
        withdrawal 
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
