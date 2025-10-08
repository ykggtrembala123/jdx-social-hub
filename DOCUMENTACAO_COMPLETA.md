# 📚 Documentação Completa - Vultos Swap Sistema de Afiliados

## 🎯 Visão Geral do Sistema

O Vultos Swap é um sistema completo de gerenciamento de afiliados com integração Discord, desenvolvido com React + Supabase (Lovable Cloud). O sistema permite que administradores gerenciem afiliados e que afiliados acompanhem seus ganhos através de dashboards personalizados.

---

## 🔐 Sistema de Autenticação

### Login via Discord ID

O sistema usa **apenas Discord ID** para autenticação, sem necessidade de senha ou criação de conta pelo usuário.

#### Para Admin:
- **Discord ID Admin Padrão**: `ADMIN_123456789`
- **Rota após login**: `/admin`
- Acesso total ao sistema

#### Para Afiliados:
- **Discord ID**: O ID vinculado quando o admin criou o código de afiliado
- **Rota após login**: `/dashboard`
- Acesso aos próprios dados e estatísticas

### Fluxo de Login

1. Usuário acessa `/auth` (ou `/`)
2. Digita seu Discord ID
3. Sistema verifica:
   - Se é admin → redireciona para `/admin`
   - Se é afiliado → redireciona para `/dashboard`
   - Se não encontrado → mostra erro

---

## 🗺️ Rotas do Sistema

| Rota | Acesso | Descrição |
|------|--------|-----------|
| `/` | Público | Redireciona para `/auth` |
| `/auth` | Público | Página de login (Discord ID) |
| `/admin` | Admin | Dashboard administrativo |
| `/dashboard` | Afiliado | Dashboard do afiliado |
| `/create-affiliate` | Admin | Criação de novo afiliado |
| `/affiliate/:code` | Admin | Detalhes de um afiliado específico |

---

## 👤 Discord ID Admin

### ID Padrão Configurado:
```
ADMIN_123456789
```

### Para alterar o Discord ID Admin:

1. Acesse o backend do Lovable Cloud
2. Na tabela `admin_config`, execute:
```sql
UPDATE admin_config 
SET discord_id = 'SEU_NOVO_DISCORD_ID' 
WHERE discord_id = 'ADMIN_123456789';
```

---

## 📊 Dashboard Administrativo (`/admin`)

### Funcionalidades:

1. **Visão Geral**
   - Total de afiliados cadastrados
   - Total de leads gerados
   - Total de ganhos do sistema

2. **Gestão de Afiliados**
   - Visualizar todos os afiliados
   - Buscar por código ou nome
   - Ver estatísticas individuais (leads, vendas, ganhos)
   - Acessar detalhes de cada afiliado

3. **Criação de Afiliados**
   - Botão "Criar Afiliado"
   - Campos necessários:
     - Nome
     - Discord ID
     - Código de afiliado (único)
     - Tier (Bronze, Prata, Ouro, Diamante)
     - Comissão personalizada

4. **Monitoramento em Tempo Real**
   - Atualização automática via Supabase Realtime
   - Alterações refletidas instantaneamente

---

## 💼 Dashboard do Afiliado (`/dashboard`)

### Funcionalidades:

1. **Estatísticas Pessoais**
   - Total de leads gerados
   - Total de vendas confirmadas
   - Total de ganhos
   - Ganhos pendentes
   - Tier atual e comissão

2. **Ganhos em Cascata**
   - Visualização de sub-afiliados
   - Comissões de cascata
   - Total de afiliados indicados

3. **Histórico de Leads**
   - Lista de todos os leads
   - Status (pendente/confirmado)
   - Valor da transação
   - Comissão recebida
   - Data de criação

4. **Sub-Afiliados**
   - Lista de afiliados indicados
   - Estatísticas de cada sub-afiliado
   - Ganhos de cascata gerados

5. **Gráficos e Evolução**
   - Gráfico de ganhos ao longo do tempo
   - Gráfico de leads vs vendas
   - Taxa de conversão

---

## 🔧 Edge Functions (Integração com Bot Discord)

### 1. `check-admin`
**Endpoint**: `/functions/v1/check-admin`

**Descrição**: Verifica se um Discord ID é de um admin.

**Request**:
```json
{
  "discordId": "123456789"
}
```

**Response**:
```json
{
  "isAdmin": true,
  "adminData": {
    "discord_id": "123456789",
    "name": "Admin Principal"
  }
}
```

---

### 2. `get-affiliate-by-discord-id`
**Endpoint**: `/functions/v1/get-affiliate-by-discord-id`

**Descrição**: Busca dados do afiliado pelo Discord ID.

**Request**:
```json
{
  "discordUserId": "987654321"
}
```

**Response**:
```json
{
  "id": "uuid",
  "code": "AFF001",
  "name": "João Silva",
  "discord_user_id": "987654321",
  "total_earnings": 1250.00,
  "total_sales": 15,
  "total_leads": 25,
  "tier": "prata",
  "commission": 30,
  "sub_affiliates_count": 3,
  "total_cascade_earnings": 150.00
}
```

---

### 3. `create-lead`
**Endpoint**: `/functions/v1/create-lead`

**Descrição**: Cria um novo lead no sistema.

**Request**:
```json
{
  "affiliate_code": "AFF001",
  "ticket_id": "TICKET123",
  "transaction_value": 1000.00,
  "client_name": "Cliente Exemplo"
}
```

**Response**:
```json
{
  "success": true,
  "lead": {
    "id": "uuid",
    "affiliate_code": "AFF001",
    "ticket_id": "TICKET123",
    "transaction_value": 1000.00,
    "status": "pending",
    "affiliate_commission": 300.00
  }
}
```

---

### 4. `confirm-sale`
**Endpoint**: `/functions/v1/confirm-sale`

**Descrição**: Confirma uma venda e atualiza os ganhos.

**Request**:
```json
{
  "ticket_id": "TICKET123"
}
```

**Response**:
```json
{
  "success": true,
  "message": "Venda confirmada com sucesso"
}
```

---

### 5. `get-affiliate`
**Endpoint**: `/functions/v1/get-affiliate`

**Descrição**: Busca dados do afiliado pelo código.

**Request**:
```json
{
  "code": "AFF001"
}
```

---

### 6. `get-system-config`
**Endpoint**: `/functions/v1/get-system-config`

**Descrição**: Retorna configurações dinâmicas do sistema.

**Response**:
```json
{
  "default_commission": 30,
  "cascade_commission": 10,
  "transaction_fee": 1.5,
  "min_withdrawal": 50.00
}
```

---

### 7. `request-withdrawal`
**Endpoint**: `/functions/v1/request-withdrawal`

**Descrição**: Cria uma solicitação de saque.

**Request**:
```json
{
  "affiliate_code": "AFF001",
  "amount": 500.00,
  "payment_method": "PIX",
  "payment_address": "chave@pix.com"
}
```

---

## 🗄️ Estrutura do Banco de Dados

### Tabela: `affiliates`
```sql
- id (uuid)
- code (text, unique)
- name (text)
- username (text)
- discord_user_id (text)
- user_id (text)
- tier (enum: bronze, prata, ouro, diamante)
- commission (numeric) -- porcentagem
- cascade_commission (numeric)
- total_leads (integer)
- total_sales (integer)
- total_earnings (numeric)
- pending_earnings (numeric)
- cascade_earnings (numeric)
- referrals_count (integer)
- referred_by (text) -- código do afiliado que indicou
- created_at (timestamp)
```

### Tabela: `leads`
```sql
- id (uuid)
- affiliate_code (text)
- cascade_code (text) -- código do afiliado pai
- ticket_id (text, unique)
- client_name (text)
- transaction_value (numeric)
- fee_percentage (numeric)
- total_profit (numeric)
- affiliate_commission (numeric)
- cascade_commission (numeric)
- company_profit (numeric)
- status (text: pending, confirmed)
- confirmed_at (timestamp)
- created_at (timestamp)
```

### Tabela: `withdrawal_requests`
```sql
- id (uuid)
- affiliate_code (text)
- amount (numeric)
- payment_method (text)
- payment_address (text)
- status (text: pending, approved, rejected)
- notes (text)
- requested_at (timestamp)
- processed_at (timestamp)
```

### Tabela: `system_config`
```sql
- id (uuid)
- key (text, unique)
- value (numeric)
- description (text)
- updated_at (timestamp)
```

### Tabela: `admin_config`
```sql
- id (uuid)
- discord_id (text, unique)
- name (text)
- created_at (timestamp)
```

### Tabela: `profiles`
```sql
- id (uuid, FK: auth.users)
- discord_id (text)
- discord_username (text)
- affiliate_code (text)
- avatar_url (text)
- role (text: admin, affiliate)
- created_at (timestamp)
- updated_at (timestamp)
```

---

## 🤖 Integração com Bot Discord

### Comandos Sugeridos para o Bot:

#### 1. `/meus-ganhos`
**Descrição**: Mostra os ganhos do afiliado

**Implementação**:
```javascript
// 1. Pegar Discord ID do usuário
const discordId = interaction.user.id;

// 2. Chamar edge function
const response = await fetch('https://oyoifasethtkfkocppzs.supabase.co/functions/v1/get-affiliate-by-discord-id', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
  },
  body: JSON.stringify({ discordUserId: discordId })
});

const data = await response.json();

// 3. Enviar resposta com:
// - Total de ganhos
// - Ganhos pendentes
// - Total de leads/vendas
// - Link para dashboard: https://seu-site.com/auth
```

#### 2. `/criar-lead`
**Descrição**: Admin cria um novo lead

**Implementação**:
```javascript
const response = await fetch('https://oyoifasethtkfkocppzs.supabase.co/functions/v1/create-lead', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
  },
  body: JSON.stringify({
    affiliate_code: 'AFF001',
    ticket_id: 'TICKET123',
    transaction_value: 1000.00,
    client_name: 'Cliente'
  })
});
```

#### 3. `/confirmar-venda`
**Descrição**: Admin confirma uma venda

**Implementação**:
```javascript
const response = await fetch('https://oyoifasethtkfkocppzs.supabase.co/functions/v1/confirm-sale', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
  },
  body: JSON.stringify({
    ticket_id: 'TICKET123'
  })
});
```

#### 4. `/solicitar-saque`
**Descrição**: Afiliado solicita um saque

**Implementação**:
```javascript
const response = await fetch('https://oyoifasethtkfkocppzs.supabase.co/functions/v1/request-withdrawal', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
  },
  body: JSON.stringify({
    affiliate_code: 'AFF001',
    amount: 500.00,
    payment_method: 'PIX',
    payment_address: 'chave@pix.com'
  })
});
```

---

## 🔑 Credenciais Supabase

### Project ID:
```
oyoifasethtkfkocppzs
```

### Anon Key (para uso no bot):
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im95b2lmYXNldGh0a2Zrb2NwcHpzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk2NjAxMTYsImV4cCI6MjA3NTIzNjExNn0.mu7kO3i-H4eTjM9omkOPgRz0zJTqDP5n_9Pmxmzimiw
```

### URL Base:
```
https://oyoifasethtkfkocppzs.supabase.co
```

---

## 🎨 Tiers e Comissões

| Tier | Emoji | Comissão Padrão | Comissão Cascata |
|------|-------|-----------------|------------------|
| Bronze | 🥉 | 25% | 5% |
| Prata | 🥈 | 30% | 10% |
| Ouro | 🥇 | 35% | 12% |
| Diamante | 💎 | 40% | 15% |

---

## 📝 Fluxo Completo de uma Venda

1. **Lead Criado** (via bot ou sistema)
   - Status: `pending`
   - Comissão calculada mas não creditada

2. **Venda Confirmada** (admin confirma via bot/dashboard)
   - Status muda para: `confirmed`
   - Atualiza `total_earnings` do afiliado
   - Se houver afiliado pai, credita comissão de cascata
   - Incrementa contadores (`total_sales`, `total_leads`)

3. **Solicitação de Saque**
   - Afiliado solicita saque
   - Admin aprova/rejeita
   - Sistema deduz valor de `total_earnings`

---

## 🚀 Deploy e Configuração

### URL do Site:
```
https://seu-projeto.lovable.app
```

### Login Admin:
- Discord ID: `ADMIN_123456789`
- Acessa: `/admin`

### Login Afiliado:
- Discord ID: (o ID configurado na criação)
- Acessa: `/dashboard`

---

## 🛡️ Segurança

1. **Row Level Security (RLS)** ativado em todas as tabelas
2. **Edge Functions** usam `SUPABASE_SERVICE_ROLE_KEY` para operações sensíveis
3. **Validação de Discord ID** em todas as operações
4. **Admin separado** em tabela específica (`admin_config`)
5. **Sem senhas** - autenticação apenas via Discord ID

---

## 📞 Suporte

Para dúvidas ou problemas:
1. Verifique os logs do Lovable Cloud
2. Teste as Edge Functions individualmente
3. Confira se os Discord IDs estão corretos
4. Valide as RLS policies no banco

---

## 📌 Checklist de Integração Bot

- [ ] Configurar Supabase URL e Anon Key no bot
- [ ] Implementar comando `/meus-ganhos`
- [ ] Implementar comando `/criar-lead` (admin)
- [ ] Implementar comando `/confirmar-venda` (admin)
- [ ] Implementar comando `/solicitar-saque`
- [ ] Testar cada endpoint individualmente
- [ ] Validar respostas e erros
- [ ] Adicionar mensagens de erro amigáveis
- [ ] Configurar link para dashboard no bot

---

**Sistema desenvolvido com ❤️ usando Lovable + Supabase**
