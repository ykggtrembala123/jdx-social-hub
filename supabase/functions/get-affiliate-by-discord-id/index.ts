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
    const { discordUserId } = await req.json();

    if (!discordUserId) {
      return new Response(
        JSON.stringify({ error: "Discord User ID é obrigatório" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Get affiliate by user_id (Discord ID is stored in user_id column)
    const { data: affiliate, error: affiliateError } = await supabase
      .from("affiliates")
      .select("*")
      .eq("user_id", discordUserId)
      .single();

    if (affiliateError || !affiliate) {
      console.error("Error fetching affiliate by Discord ID:", affiliateError);
      return new Response(
        JSON.stringify({ error: "Afiliado não encontrado para este Discord ID" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get sub-affiliates count
    const { count: subAffiliatesCount, error: subAffiliatesError } = await supabase
      .from("affiliates")
      .select("id", { count: "exact" })
      .eq("referred_by", affiliate.code);

    if (subAffiliatesError) {
      console.error("Error fetching sub-affiliates count:", subAffiliatesError);
    }

    // Get total cascade earnings from leads where this affiliate is the cascade_code
    const { data: cascadeLeads, error: cascadeLeadsError } = await supabase
      .from("leads")
      .select("cascade_commission")
      .eq("cascade_code", affiliate.code)
      .eq("status", "confirmed");

    let totalCascadeEarnings = 0;
    if (!cascadeLeadsError && cascadeLeads) {
      totalCascadeEarnings = cascadeLeads.reduce((sum, lead) => sum + lead.cascade_commission, 0);
    } else if (cascadeLeadsError) {
      console.error("Error fetching cascade leads:", cascadeLeadsError);
    }

    // Combine affiliate data with sub-affiliates count and total cascade earnings
    const responseData = {
      ...affiliate,
      sub_affiliates_count: subAffiliatesCount || 0,
      total_cascade_earnings: totalCascadeEarnings,
    };

    return new Response(JSON.stringify(responseData), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Erro desconhecido" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
