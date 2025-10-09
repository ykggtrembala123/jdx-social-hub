# Guia de Integração: Sistema de Autenticação OTP via Discord

## 📋 Visão Geral

Este documento descreve como integrar o sistema de autenticação OTP (One-Time Password) com o bot do Discord. O fluxo de autenticação agora inclui uma camada adicional de segurança onde o usuário recebe um código de 6 dígitos via mensagem direta no Discord.

## 🔐 Fluxo de Autenticação

1. **Usuário insere Discord ID** no site
2. **Sistema gera OTP** de 6 dígitos e armazena no banco
3. **Sistema retorna o OTP** para ser enviado pelo bot
4. **Bot envia mensagem direta** para o usuário no Discord com o código
5. **Usuário insere o código OTP** no site
6. **Sistema valida o código** e permite o acesso

## 🎯 Endpoints da API

### Base URL
```
https://oyoifasethtkfkocppzs.supabase.co/functions/v1
```

### 1. Gerar OTP (`generate-otp`)

**Endpoint:** `POST /generate-otp`

**Descrição:** Gera um código OTP de 6 dígitos para o Discord ID fornecido.

**Request Body:**
```json
{
  "discordId": "123456789012345678"
}
```

**Response (Sucesso):**
```json
{
  "success": true,
  "otpCode": "123456",
  "discordId": "123456789012345678",
  "expiresAt": "2024-01-08T15:30:00.000Z",
  "message": "OTP gerado com sucesso. Código deve ser enviado via Discord bot."
}
```

**Response (Discord ID não encontrado):**
```json
{
  "success": false,
  "error": "Discord ID não encontrado no sistema"
}
```

### 2. Verificar OTP (`verify-otp`)

**Endpoint:** `POST /verify-otp`

**Descrição:** Valida o código OTP inserido pelo usuário.

**Request Body:**
```json
{
  "discordId": "123456789012345678",
  "otpCode": "123456"
}
```

**Response (Sucesso):**
```json
{
  "success": true,
  "message": "OTP verificado com sucesso",
  "discordId": "123456789012345678"
}
```

**Response (Erro):**
```json
{
  "success": false,
  "error": "Código OTP incorreto. 2 tentativa(s) restante(s)."
}
```

## 🤖 Implementação no Bot Discord

### Requisitos
- Discord.js v14 ou superior
- Node.js v16 ou superior
- Permissões do bot: `Send Messages`, `Send Messages in Threads`

### Código de Integração

```javascript
const { Client, GatewayIntentBits, EmbedBuilder } = require('discord.js');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.DirectMessages,
  ],
});

const SUPABASE_URL = 'https://oyoifasethtkfkocppzs.supabase.co/functions/v1';

/**
 * Função para enviar código OTP via DM
 * Esta função deve ser chamada quando o sistema web gerar um OTP
 */
async function sendOTPToUser(discordUserId, otpCode, expiresAt) {
  try {
    // Buscar o usuário pelo ID
    const user = await client.users.fetch(discordUserId);
    
    if (!user) {
      console.error(`Usuário com ID ${discordUserId} não encontrado`);
      return false;
    }

    // Calcular tempo de expiração
    const expiresDate = new Date(expiresAt);
    const now = new Date();
    const minutesLeft = Math.floor((expiresDate - now) / 60000);

    // Criar embed com o código OTP
    const embed = new EmbedBuilder()
      .setColor('#9b87f5')
      .setTitle('🔐 Código de Autenticação - Vultos Swap')
      .setDescription('Use o código abaixo para fazer login no Dashboard de Afiliados.')
      .addFields(
        { 
          name: '📱 Seu Código OTP', 
          value: `\`\`\`${otpCode}\`\`\``, 
          inline: false 
        },
        { 
          name: '⏰ Válido por', 
          value: `${minutesLeft} minutos`, 
          inline: true 
        },
        { 
          name: '🔢 Tentativas', 
          value: '3 tentativas', 
          inline: true 
        }
      )
      .setFooter({ 
        text: '⚠️ Não compartilhe este código com ninguém!' 
      })
      .setTimestamp();

    // Enviar mensagem direta
    await user.send({ embeds: [embed] });
    
    console.log(`✅ Código OTP enviado para ${user.tag}`);
    return true;

  } catch (error) {
    console.error('❌ Erro ao enviar OTP:', error);
    
    // Se não conseguir enviar DM, pode ser porque o usuário bloqueou DMs
    if (error.code === 50007) {
      console.error(`Usuário ${discordUserId} tem DMs desabilitadas`);
    }
    
    return false;
  }
}

/**
 * Webhook/Listener para receber solicitações de OTP do backend
 * Você pode implementar isso de várias formas:
 * 1. Servidor Express que recebe webhooks
 * 2. Polling periódico no banco de dados
 * 3. Listener via WebSocket
 */

// OPÇÃO 1: Servidor Express (Recomendado)
const express = require('express');
const app = express();

app.use(express.json());

app.post('/webhook/send-otp', async (req, res) => {
  const { discordId, otpCode, expiresAt } = req.body;

  if (!discordId || !otpCode || !expiresAt) {
    return res.status(400).json({ 
      success: false, 
      error: 'Parâmetros faltando' 
    });
  }

  const success = await sendOTPToUser(discordId, otpCode, expiresAt);

  res.json({ 
    success, 
    message: success ? 'OTP enviado com sucesso' : 'Falha ao enviar OTP' 
  });
});

app.listen(3000, () => {
  console.log('🚀 Webhook server rodando na porta 3000');
});

// OPÇÃO 2: Polling (Alternativa)
async function checkForPendingOTPs() {
  try {
    // Aqui você faria uma query no banco para buscar OTPs pendentes de envio
    // e então chamaria sendOTPToUser() para cada um
    
    // Exemplo simplificado:
    // const pendingOTPs = await getPendingOTPsFromDatabase();
    // for (const otp of pendingOTPs) {
    //   await sendOTPToUser(otp.discord_id, otp.code, otp.expires_at);
    //   await markOTPAsSent(otp.id);
    // }
  } catch (error) {
    console.error('Erro ao verificar OTPs pendentes:', error);
  }
}

// Verificar a cada 5 segundos
// setInterval(checkForPendingOTPs, 5000);

client.once('ready', () => {
  console.log(`✅ Bot conectado como ${client.user.tag}`);
});

client.login('SEU_BOT_TOKEN');
```

## 🔄 Integração Completa

### Método Recomendado: Webhook

Para integrar completamente, você precisa criar um endpoint no bot que o backend possa chamar quando um OTP for gerado:

1. **No Bot Discord:**
   - Crie um servidor Express
   - Exponha um endpoint `/webhook/send-otp`
   - Proteja com autenticação (Bearer token)

2. **No Backend (Edge Function):**
   - Após gerar o OTP, faça uma chamada HTTP para o bot
   - Passe o Discord ID, código e tempo de expiração

### Exemplo de Modificação na Edge Function

```typescript
// Adicionar ao final da generate-otp/index.ts

// Enviar para o bot Discord
const botWebhookUrl = Deno.env.get('DISCORD_BOT_WEBHOOK_URL');
if (botWebhookUrl) {
  try {
    await fetch(botWebhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${Deno.env.get('BOT_WEBHOOK_SECRET')}`
      },
      body: JSON.stringify({
        discordId,
        otpCode,
        expiresAt
      })
    });
  } catch (error) {
    console.error('Erro ao notificar bot:', error);
  }
}
```

## 🔒 Segurança

### Configurações de Segurança
- **Expiração:** Códigos OTP expiram em 5 minutos
- **Tentativas:** Máximo de 3 tentativas por código
- **Uso único:** Cada código só pode ser usado uma vez
- **Limpeza:** Códigos expirados são mantidos por 1 hora para logs

### Variáveis de Ambiente Necessárias

```bash
# No bot Discord
DISCORD_BOT_TOKEN=seu_token_aqui
BOT_WEBHOOK_SECRET=segredo_compartilhado_com_backend

# No Supabase (Edge Functions)
DISCORD_BOT_WEBHOOK_URL=https://seu-bot.com/webhook/send-otp
BOT_WEBHOOK_SECRET=mesmo_segredo_do_bot
```

## 📊 Tabela OTP Codes

```sql
CREATE TABLE otp_codes (
  id UUID PRIMARY KEY,
  discord_id TEXT NOT NULL,
  code TEXT NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  used BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  attempts INTEGER DEFAULT 0
);
```

## 🐛 Troubleshooting

### Usuário não recebe a DM
- Verificar se o usuário tem DMs abertas
- Verificar se o bot tem permissões corretas
- Verificar se o Discord ID está correto

### Código expira muito rápido
- Ajustar tempo de expiração na Edge Function `generate-otp`
- Padrão: 5 minutos

### Bot não envia a mensagem
- Verificar conexão com Discord API
- Verificar se o bot está online
- Verificar logs de erro

## 📞 Suporte

Para dúvidas ou problemas, consulte a documentação completa do sistema em `DOCUMENTACAO_COMPLETA.md`.
