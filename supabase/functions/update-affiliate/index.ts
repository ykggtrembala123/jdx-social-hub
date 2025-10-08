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
    const { code, name, username, commission, cascade_commission, tier, referred_by, discord_user_id } = await req.json();

    if (!code) {
      return new Response(
        JSON.stringify({ error: "Código do afiliado é obrigatório" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Prepare update data
    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (username !== undefined) updateData.username = username;
    if (commission !== undefined) updateData.commission = commission;
    if (cascade_commission !== undefined) updateData.cascade_commission = cascade_commission;
    if (tier !== undefined) updateData.tier = tier;
    if (referred_by !== undefined) updateData.referred_by = referred_by;
    if (discord_user_id !== undefined) updateData.discord_user_id = discord_user_id;

    // Update affiliate
    const { data: affiliate, error: updateError } = await supabase
      .from("affiliates")
      .update(updateData)
      .eq("code", code)
      .select()
      .single();

    if (updateError) {
      console.error("Error updating affiliate:", updateError);
      return new Response(
        JSON.stringify({ error: "Erro ao atualizar afiliado" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Affiliate updated successfully:", affiliate);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Afiliado atualizado com sucesso!",
        affiliate 
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
