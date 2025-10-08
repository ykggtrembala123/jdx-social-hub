# 🤖 Sistema de Afiliados - Instruções Completas de Integração

## 📋 Funcionalidades Implementadas

### ✅ Site na Lovable
- **Dashboard Admin** (`/admin`) - Gerenciar todos os afiliados
- **Dashboard Afiliado** (`/dashboard`) - Ver seus próprios ganhos
- **Gerenciamento de Saques** (`/admin/withdrawals`) - Aprovar/rejeitar saques
- **Página de Detalhes** (`/affiliate/:code`) - Histórico completo
- **Edição de Afiliados** (`/affiliate/:code/edit`) - Editar todos os campos
- **Criação de Afiliados** (`/create-affiliate`) - Formulário completo
- **Autenticação via Discord ID** - Admin e afiliados fazem login com Discord ID

### ✅ Backend (Edge Functions)
- `get-affiliate` - Buscar dados de um afiliado
- `get-affiliate-by-discord-id` - Login de afiliado via Discord ID
- `create-lead` - Criar um novo lead
- `confirm-sale` - Confirmar venda e calcular comissões
- `request-withdrawal` - Solicitar saque com notificação Discord
- `update-affiliate` - ✨ **NOVO** - Editar dados de afiliado
- `delete-affiliate` - ✨ **NOVO** - Desativar afiliado (soft delete)
- `update-withdrawal-status` - ✨ **NOVO** - Processar saques
- `check-admin` - Verificar se Discord ID é admin
- `get-system-config` - Buscar configurações do sistema

---

## 🔗 Endpoints da API

### Base URL
```
https://oyoifasethtkfkocppzs.supabase.co/functions/v1
```

### 1️⃣ Buscar Afiliado por Código
```javascript
POST /get-affiliate

// Body
{
  "code": "JOAO123"
}

// Response
{
  "id": "uuid",
  "code": "JOAO123",
  "name": "João Silva",
  "commission": 30,
  "tier": "prata",
  "total_leads": 5,
  "total_sales": 3,
  "total_earnings": 150.50,
  "is_active": true,
  // ... outros campos
}
```

### 2️⃣ Buscar Afiliado por Discord ID
```javascript
POST /get-affiliate-by-discord-id

// Body
{
  "discordUserId": "123456789"
}

// Response
{
  "id": "uuid",
  "code": "JOAO123",
  "name": "João Silva",
  "discord_user_id": "123456789",
  "total_earnings": 150.50,
  // ... todos os campos
}
```

### 3️⃣ Criar Lead (quando abrir ticket)
```javascript
POST /create-lead

// Body
{
  "ticketId": "ticket-123",
  "affiliateCode": "JOAO123",
  "clientName": "Cliente Nome",
  "transactionValue": 1000,
  "feePercentage": 12
}

// Response
{
  "success": true,
  "lead": {
    "ticket_id": "ticket-123",
    "affiliate_commission": 36,
    "cascade_commission": 12,
    "company_profit": 72,
    "status": "pending"
  }
}
```

### 4️⃣ Confirmar Venda
```javascript
POST /confirm-sale

// Body
{
  "ticketId": "ticket-123"
}

// Response
{
  "success": true,
  "message": "Venda confirmada com sucesso!"
}
```

### 5️⃣ ✨ **NOVO** - Editar Afiliado
```javascript
POST /update-affiliate

// Body (todos os campos são opcionais)
{
  "code": "JOAO123",
  "name": "João Silva Atualizado",
  "username": "joao_novo",
  "commission": 35,
  "cascade_commission": 12,
  "tier": "ouro",
  "referred_by": "CODIGO_REFERENCIADOR",
  "discord_user_id": "987654321"
}

// Response
{
  "success": true,
  "message": "Afiliado atualizado com sucesso!",
  "affiliate": { ... }
}
```

### 6️⃣ ✨ **NOVO** - Desativar Afiliado
```javascript
POST /delete-affiliate

// Body
{
  "code": "JOAO123"
}

// Response
{
  "success": true,
  "message": "Afiliado desativado com sucesso!",
  "affiliate": { ..., "is_active": false }
}
```

### 7️⃣ ✨ **NOVO** - Processar Saque
```javascript
POST /update-withdrawal-status

// Body
{
  "withdrawalId": "uuid-do-saque",
  "status": "completed", // "completed", "rejected", "approved"
  "notes": "Pago via PIX em 08/01/2025" // opcional
}

// Response
{
  "success": true,
  "message": "Status atualizado com sucesso!",
  "withdrawal": { ... }
}

// ⚠️ Esta função também envia notificação automática no Discord!
```

### 8️⃣ Solicitar Saque
```javascript
POST /request-withdrawal

// Body
{
  "affiliateCode": "JOAO123",
  "amount": 150.00,
  "paymentMethod": "pix", // "pix" ou "crypto"
  "paymentAddress": "email@example.com" // Chave PIX ou endereço crypto
}

// Response
{
  "success": true,
  "message": "Solicitação de saque criada com sucesso!",
  "withdrawal": { ... }
}

// ⚠️ Envia notificação automática no Discord via webhook!
```

---

## 🤖 Como Integrar no Bot Discord

### 1. Instalar Dependência
```bash
npm install node-fetch
```

### 2. Código Base para o Bot
```javascript
const fetch = require('node-fetch');

const API_BASE_URL = 'https://oyoifasethtkfkocppzs.supabase.co/functions/v1';

// ===== FUNÇÕES EXISTENTES =====

async function getAffiliate(code) {
  try {
    const response = await fetch(`${API_BASE_URL}/get-affiliate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: code.toUpperCase() })
    });
    return await response.json();
  } catch (error) {
    console.error('Erro:', error);
    return null;
  }
}

async function getAffiliateByDiscordId(discordUserId) {
  try {
    const response = await fetch(`${API_BASE_URL}/get-affiliate-by-discord-id`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ discordUserId })
    });
    return await response.json();
  } catch (error) {
    console.error('Erro:', error);
    return null;
  }
}

async function createLead(ticketId, affiliateCode, clientName, transactionValue, feePercentage) {
  try {
    const response = await fetch(`${API_BASE_URL}/create-lead`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ticketId,
        affiliateCode: affiliateCode.toUpperCase(),
        clientName,
        transactionValue,
        feePercentage
      })
    });
    return await response.json();
  } catch (error) {
    console.error('Erro:', error);
    return null;
  }
}

async function confirmSale(ticketId) {
  try {
    const response = await fetch(`${API_BASE_URL}/confirm-sale`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ticketId })
    });
    return await response.json();
  } catch (error) {
    console.error('Erro:', error);
    return null;
  }
}

// ===== ✨ NOVAS FUNÇÕES =====

async function updateAffiliate(code, updates) {
  try {
    const response = await fetch(`${API_BASE_URL}/update-affiliate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code, ...updates })
    });
    return await response.json();
  } catch (error) {
    console.error('Erro:', error);
    return null;
  }
}

async function deleteAffiliate(code) {
  try {
    const response = await fetch(`${API_BASE_URL}/delete-affiliate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code })
    });
    return await response.json();
  } catch (error) {
    console.error('Erro:', error);
    return null;
  }
}

async function updateWithdrawalStatus(withdrawalId, status, notes = null) {
  try {
    const response = await fetch(`${API_BASE_URL}/update-withdrawal-status`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ withdrawalId, status, notes })
    });
    return await response.json();
  } catch (error) {
    console.error('Erro:', error);
    return null;
  }
}
```

### 3. Exemplos de Comandos Slash

#### ✨ Comando: `/meus_ganhos`
```javascript
{
  name: 'meus_ganhos',
  description: 'Ver seus ganhos como afiliado'
}

// Handler
if (interaction.commandName === 'meus_ganhos') {
  const affiliate = await getAffiliateByDiscordId(interaction.user.id);
  
  if (!affiliate) {
    return interaction.reply({
      content: '❌ Você não está cadastrado como afiliado!',
      ephemeral: true
    });
  }

  const embed = new EmbedBuilder()
    .setTitle(`💰 Seus Ganhos - ${affiliate.code}`)
    .setColor(0x00ff00)
    .addFields(
      { name: '📊 Total de Leads', value: affiliate.total_leads.toString(), inline: true },
      { name: '✅ Vendas Confirmadas', value: affiliate.total_sales.toString(), inline: true },
      { name: '💵 Total Ganho', value: `R$ ${affiliate.total_earnings.toFixed(2)}`, inline: true },
      { name: '⏳ Ganhos Pendentes', value: `R$ ${affiliate.pending_earnings.toFixed(2)}`, inline: true },
      { name: '🔄 Ganhos em Cascata', value: `R$ ${affiliate.cascade_earnings.toFixed(2)}`, inline: true },
      { name: '🏆 Tier', value: affiliate.tier.toUpperCase(), inline: true }
    )
    .setFooter({ text: `🔗 Acesse: vultos-swap.lovable.app/affiliate/${affiliate.code}` });

  await interaction.reply({ embeds: [embed], ephemeral: true });
}
```

#### ✨ Comando Admin: `/admin_editar_afiliado`
```javascript
{
  name: 'admin_editar_afiliado',
  description: 'Editar dados de um afiliado',
  options: [
    {
      name: 'codigo',
      type: 3, // STRING
      description: 'Código do afiliado',
      required: true
    },
    {
      name: 'campo',
      type: 3,
      description: 'Campo a editar',
      required: true,
      choices: [
        { name: 'Nome', value: 'name' },
        { name: 'Username', value: 'username' },
        { name: 'Comissão', value: 'commission' },
        { name: 'Tier', value: 'tier' },
        { name: 'Discord ID', value: 'discord_user_id' }
      ]
    },
    {
      name: 'valor',
      type: 3,
      description: 'Novo valor',
      required: true
    }
  ]
}

// Handler
if (interaction.commandName === 'admin_editar_afiliado') {
  // Verificar se é admin (implementar sua lógica)
  if (!isAdmin(interaction.user.id)) {
    return interaction.reply({ content: '❌ Sem permissão!', ephemeral: true });
  }

  const codigo = interaction.options.getString('codigo');
  const campo = interaction.options.getString('campo');
  let valor = interaction.options.getString('valor');

  // Converter valor se for número
  if (campo === 'commission' || campo === 'cascade_commission') {
    valor = parseFloat(valor);
  }

  const result = await updateAffiliate(codigo, { [campo]: valor });

  if (result?.success) {
    await interaction.reply({
      content: `✅ Afiliado ${codigo} atualizado!\n**${campo}**: ${valor}`,
      ephemeral: true
    });
  } else {
    await interaction.reply({
      content: `❌ Erro ao atualizar: ${result?.error || 'Erro desconhecido'}`,
      ephemeral: true
    });
  }
}
```

#### ✨ Comando Admin: `/admin_processar_saque`
```javascript
{
  name: 'admin_processar_saque',
  description: 'Aprovar ou rejeitar saque',
  options: [
    {
      name: 'saque_id',
      type: 3,
      description: 'ID do saque (UUID)',
      required: true
    },
    {
      name: 'acao',
      type: 3,
      description: 'Ação a realizar',
      required: true,
      choices: [
        { name: '✅ Marcar como Pago', value: 'completed' },
        { name: '❌ Rejeitar', value: 'rejected' },
        { name: '⏳ Aprovar (em processamento)', value: 'approved' }
      ]
    },
    {
      name: 'observacoes',
      type: 3,
      description: 'Observações (opcional)',
      required: false
    }
  ]
}

// Handler
if (interaction.commandName === 'admin_processar_saque') {
  if (!isAdmin(interaction.user.id)) {
    return interaction.reply({ content: '❌ Sem permissão!', ephemeral: true });
  }

  const saqueId = interaction.options.getString('saque_id');
  const acao = interaction.options.getString('acao');
  const obs = interaction.options.getString('observacoes');

  const result = await updateWithdrawalStatus(saqueId, acao, obs);

  if (result?.success) {
    const statusText = {
      completed: '✅ PAGO',
      rejected: '❌ REJEITADO',
      approved: '⏳ APROVADO'
    }[acao];

    await interaction.reply({
      content: `${statusText} - Saque processado com sucesso!\n${obs ? `📝 **Obs**: ${obs}` : ''}`,
      ephemeral: true
    });
  } else {
    await interaction.reply({
      content: `❌ Erro: ${result?.error || 'Erro desconhecido'}`,
      ephemeral: true
    });
  }
}
```

---

## 📊 Fluxo Completo Atualizado

1. **Afiliado é criado** no dashboard admin → Vincula Discord ID
2. **Afiliado usa `/meus_ganhos`** → Sistema busca por Discord ID automaticamente
3. **Cliente abre ticket** → Lead é criado via API
4. **Venda confirmada** → Comissões calculadas e registradas
5. **Afiliado solicita saque** → Notificação automática no Discord
6. **Admin processa saque** → Afiliado é notificado automaticamente

---

## 🆕 Novidades Principais

### 🔐 Sistema de Login
- **Admin**: Usa Discord ID fixo (`ADMIN_123456789`)
- **Afiliados**: Login automático com Discord ID vinculado

### 💰 Sistema de Saques Completo
- Afiliados solicitam via dashboard
- Admins gerenciam em `/admin/withdrawals`
- Notificações automáticas via Discord webhook

### ✏️ Gerenciamento Total
- Editar qualquer campo do afiliado
- Desativar afiliados (soft delete com `is_active`)
- Histórico completo preservado

### 📱 Interface Melhorada
- Botões de editar/excluir na página de detalhes (apenas para admins)
- Dashboard de saques com filtros de status
- Gráficos e estatísticas em tempo real

---

## ⚙️ Configurações Importantes

### Discord Webhook
Configure no Supabase Secrets:
- **Nome**: `DISCORD_WEBHOOK_URL`
- **Valor**: URL do seu webhook Discord
- **Uso**: Notificações automáticas de saques

### Admin Discord ID
Padrão: `ADMIN_123456789`

Para adicionar mais admins, insira na tabela `admin_config`:
```sql
INSERT INTO admin_config (discord_id, name)
VALUES ('SEU_DISCORD_ID', 'Seu Nome');
```

---

## 🔒 Segurança

- ✅ RLS (Row Level Security) em todas as tabelas
- ✅ Soft delete (afiliados não são removidos permanentemente)
- ✅ Validações em todas as Edge Functions
- ✅ Autenticação via Discord ID único
- ✅ Notificações seguras via webhook

---

## 🚀 Próximos Passos Recomendados

1. **Implementar comandos** de gerenciamento no bot
2. **Configurar webhook** Discord para notificações
3. **Testar fluxo completo** de saque
4. **Adicionar mais admins** na tabela `admin_config`
5. **Personalizar** notificações e mensagens

---

**Data de Atualização**: 08/01/2025  
**Versão**: 3.0 (Gerenciamento Completo)
