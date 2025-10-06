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
    const { ticketId } = await req.json();

    if (!ticketId) {
      return new Response(
        JSON.stringify({ error: "Ticket ID é obrigatório" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Get lead
    const { data: lead, error: leadError } = await supabase
      .from("leads")
      .select("*")
      .eq("ticket_id", ticketId)
      .single();

    if (leadError || !lead) {
      return new Response(
        JSON.stringify({ error: "Lead não encontrado" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (lead.status === "confirmed") {
      return new Response(
        JSON.stringify({ error: "Esta venda já foi confirmada" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get affiliate
    const { data: affiliate, error: affiliateError } = await supabase
      .from("affiliates")
      .select("*")
      .eq("code", lead.affiliate_code)
      .single();

    if (affiliateError || !affiliate) {
      return new Response(
        JSON.stringify({ error: "Afiliado não encontrado" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Update lead status
    await supabase
      .from("leads")
      .update({
        status: "confirmed",
        confirmed_at: new Date().toISOString()
      })
      .eq("ticket_id", ticketId);

    // Update affiliate stats
    await supabase
      .from("affiliates")
      .update({
        total_sales: affiliate.total_sales + 1,
        total_earnings: affiliate.total_earnings + lead.affiliate_commission,
        pending_earnings: Math.max(0, affiliate.pending_earnings - lead.affiliate_commission)
      })
      .eq("code", lead.affiliate_code);

    // Update cascade affiliate if exists
    if (affiliate.referred_by && lead.cascade_commission > 0) {
      const { data: cascadeAffiliate } = await supabase
        .from("affiliates")
        .select("*")
        .eq("code", affiliate.referred_by)
        .single();

      if (cascadeAffiliate) {
        await supabase
          .from("affiliates")
          .update({
            cascade_earnings: cascadeAffiliate.cascade_earnings + lead.cascade_commission
          })
          .eq("code", affiliate.referred_by);
      }
    }

    return new Response(
      JSON.stringify({ success: true, message: "Venda confirmada com sucesso!" }),
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
