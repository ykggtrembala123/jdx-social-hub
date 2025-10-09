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

    const { discordId, otpCode } = await req.json();

    if (!discordId || !otpCode) {
      throw new Error('Discord ID e código OTP são obrigatórios');
    }

    console.log('Verificando OTP para Discord ID:', discordId);

    // Buscar OTP válido
    const { data: otpData, error: otpError } = await supabaseClient
      .from('otp_codes')
      .select('*')
      .eq('discord_id', discordId)
      .eq('used', false)
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (otpError) {
      console.error('Erro ao buscar OTP:', otpError);
      throw otpError;
    }

    if (!otpData) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Código OTP não encontrado ou expirado. Solicite um novo código.' 
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 401 
        }
      );
    }

    // Verificar número de tentativas (máximo 3)
    if (otpData.attempts >= 3) {
      await supabaseClient
        .from('otp_codes')
        .update({ used: true })
        .eq('id', otpData.id);

      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Número máximo de tentativas excedido. Solicite um novo código.' 
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 401 
        }
      );
    }

    // Verificar se o código está correto
    if (otpData.code !== otpCode) {
      // Incrementar tentativas
      await supabaseClient
        .from('otp_codes')
        .update({ attempts: otpData.attempts + 1 })
        .eq('id', otpData.id);

      const remainingAttempts = 3 - (otpData.attempts + 1);
      
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: `Código OTP incorreto. ${remainingAttempts} tentativa(s) restante(s).` 
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 401 
        }
      );
    }

    // Marcar OTP como usado
    await supabaseClient
      .from('otp_codes')
      .update({ used: true })
      .eq('id', otpData.id);

    console.log('OTP verificado com sucesso para:', discordId);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'OTP verificado com sucesso',
        discordId 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error: any) {
    console.error('Erro ao verificar OTP:', error);
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
