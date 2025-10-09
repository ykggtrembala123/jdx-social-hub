import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { discordId } = await req.json();

    if (!discordId) {
      throw new Error('Discord ID é obrigatório');
    }

    console.log('Gerando OTP para Discord ID:', discordId);

    // Verificar se o Discord ID existe (admin ou afiliado)
    const { data: adminData } = await supabaseClient
      .from('admin_config')
      .select('discord_id')
      .eq('discord_id', discordId)
      .maybeSingle();

    const { data: affiliateData } = await supabaseClient
      .from('affiliates')
      .select('discord_user_id')
      .eq('discord_user_id', discordId)
      .maybeSingle();

    if (!adminData && !affiliateData) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Discord ID não encontrado no sistema' 
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 404 
        }
      );
    }

    // Limpar OTPs antigos do usuário
    await supabaseClient
      .from('otp_codes')
      .delete()
      .eq('discord_id', discordId);

    // Gerar código OTP de 6 dígitos
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();

    // Tempo de expiração: 5 minutos
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString();

    // Salvar OTP no banco
    const { error: insertError } = await supabaseClient
      .from('otp_codes')
      .insert({
        discord_id: discordId,
        code: otpCode,
        expires_at: expiresAt,
        used: false,
        attempts: 0
      });

    if (insertError) {
      console.error('Erro ao salvar OTP:', insertError);
      throw insertError;
    }

    console.log('OTP gerado com sucesso:', otpCode);

    return new Response(
      JSON.stringify({ 
        success: true, 
        otpCode,
        discordId,
        expiresAt,
        message: 'OTP gerado com sucesso. Código deve ser enviado via Discord bot.'
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error: any) {
    console.error('Erro ao gerar OTP:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});
