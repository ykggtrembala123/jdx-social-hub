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
    const { ticketId, affiliateCode, clientName, transactionValue, feePercentage } = await req.json();

    if (!ticketId || !affiliateCode || !transactionValue || !feePercentage) {
      return new Response(
        JSON.stringify({ error: "Todos os campos são obrigatórios" }),
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
      .eq("code", affiliateCode.toUpperCase())
      .single();

    if (affiliateError || !affiliate) {
      return new Response(
        JSON.stringify({ error: "Afiliado não encontrado" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Calculate commissions
    const totalProfit = (transactionValue * feePercentage) / 100;
    const affiliateCommission = (totalProfit * affiliate.commission) / 100;
    let cascadeCommission = 0;

    if (affiliate.referred_by) {
      const { data: cascadeAffiliate } = await supabase
        .from("affiliates")
        .select("cascade_commission")
        .eq("code", affiliate.referred_by)
        .single();

      if (cascadeAffiliate) {
        cascadeCommission = (totalProfit * cascadeAffiliate.cascade_commission) / 100;
      }
    }

    const companyProfit = totalProfit - affiliateCommission - cascadeCommission;

    // Create lead
    const { data: lead, error: leadError } = await supabase
      .from("leads")
      .insert([
        {
          ticket_id: ticketId,
          affiliate_code: affiliateCode.toUpperCase(),
          client_name: clientName,
          transaction_value: transactionValue,
          fee_percentage: feePercentage,
          total_profit: totalProfit,
          affiliate_commission: affiliateCommission,
          cascade_commission: cascadeCommission,
          company_profit: companyProfit,
          status: "pending"
        }
      ])
      .select()
      .single();

    if (leadError) {
      console.error("Error creating lead:", leadError);
      return new Response(
        JSON.stringify({ error: leadError.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Update affiliate stats
    await supabase
      .from("affiliates")
      .update({
        total_leads: affiliate.total_leads + 1,
        pending_earnings: affiliate.pending_earnings + affiliateCommission
      })
      .eq("code", affiliateCode.toUpperCase());

    return new Response(
      JSON.stringify({ success: true, lead }),
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
