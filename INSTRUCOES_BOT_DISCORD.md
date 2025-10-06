# 🎯 Sistema de Afiliados - Instruções de Integração

## 📋 O que foi criado

Criei um **sistema completo de gerenciamento de afiliados** com:

### ✅ Site na Lovable (já está rodando!)
- **Dashboard** com todos os afiliados, estatísticas e gráficos
- **Página de criação** de afiliados com validação
- **Página de detalhes** de cada afiliado com histórico de leads
- **Atualização em tempo real** via Supabase Realtime
- **Design responsivo** com gradientes e animações

### ✅ Backend (Lovable Cloud)
- **Banco de dados** com tabelas `affiliates` e `leads`
- **3 Edge Functions** para integrar com o bot:
  - `get-affiliate` - Buscar dados de um afiliado
  - `create-lead` - Criar um novo lead
  - `confirm-sale` - Confirmar uma venda e calcular comissões

---

## 🔗 Endpoints da API

### Base URL
```
https://oyoifasethtkfkocppzs.supabase.co/functions/v1
```

### 1️⃣ Buscar Afiliado
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
  // ... outros campos
}
```

### 2️⃣ Criar Lead (quando abrir ticket)
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
    // ... outros campos
  }
}
```

### 3️⃣ Confirmar Venda
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

---

## 🤖 Como Integrar no Seu Bot Discord

### 1. Instalar Dependência
```bash
npm install node-fetch
# ou
yarn add node-fetch
```

### 2. Adicionar no início do seu index.js
```javascript
const fetch = require('node-fetch');

// URL base da API
const API_BASE_URL = 'https://oyoifasethtkfkocppzs.supabase.co/functions/v1';

// Função para buscar afiliado
async function getAffiliate(code) {
  try {
    const response = await fetch(`${API_BASE_URL}/get-affiliate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: code.toUpperCase() })
    });
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Erro ao buscar afiliado:', error);
    return null;
  }
}

// Função para criar lead
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
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Erro ao criar lead:', error);
    return null;
  }
}

// Função para confirmar venda
async function confirmSale(ticketId) {
  try {
    const response = await fetch(`${API_BASE_URL}/confirm-sale`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ticketId })
    });
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Erro ao confirmar venda:', error);
    return null;
  }
}
```

### 3. Modificar o Comando /criar_afiliado
```javascript
// Ao invés de salvar em arquivo JSON, use a API do site
if (interaction.commandName === 'criar_afiliado') {
  // ... seu código atual para pegar os dados ...
  
  // Criar no banco via site (você pode adicionar um endpoint para isso)
  // Ou continue criando localmente e sincronize periodicamente
}
```

### 4. Modificar a Criação de Ticket
```javascript
// Quando criar um ticket com código de afiliado
if (interaction.customId === 'abrirTicket') {
  // ... código do modal ...
  
  // Depois de criar o ticket, registrar o lead
  if (codigoAfiliado) {
    const lead = await createLead(
      channelTicket.id,
      codigoAfiliado,
      interaction.user.username,
      0, // Valor ainda não definido
      12 // Taxa padrão
    );
    
    if (lead && lead.success) {
      console.log('✅ Lead registrado no sistema!');
    }
  }
}
```

### 5. Modificar o Comando /confirmar_venda
```javascript
if (interaction.commandName === 'confirmar_venda') {
  const ticketId = interaction.options.getString('ticket_id');
  const valorFinal = interaction.options.getNumber('valor_final');
  const taxa = interaction.options.getNumber('taxa');
  
  // Confirmar venda via API
  const result = await confirmSale(ticketId);
  
  if (result && result.success) {
    await interaction.reply({
      content: '✅ Venda confirmada! As comissões foram calculadas e registradas.',
      ephemeral: true
    });
  } else {
    await interaction.reply({
      content: '❌ Erro ao confirmar venda. Verifique o ticket ID.',
      ephemeral: true
    });
  }
}
```

---

## 🎨 Customização do Site

O site está totalmente funcional e pode ser acessado pela URL do seu projeto Lovable.

### Funcionalidades atuais:
- ✅ Listagem de todos os afiliados
- ✅ Busca por código ou nome
- ✅ Estatísticas globais
- ✅ Página de detalhes com histórico
- ✅ Criação de novos afiliados
- ✅ Atualização em tempo real

### Para adicionar mais funcionalidades:
1. **Página de relatórios** - gráficos de performance
2. **Sistema de pagamentos** - marcar comissões como pagas
3. **Dashboard do afiliado** - cada afiliado ver suas próprias stats
4. **Sistema de notificações** - avisar quando houver novas vendas

---

## 📊 Fluxo Completo

1. **Afiliado é criado** (no site ou via comando Discord)
2. **Cliente abre ticket** → Lead é criado automaticamente via API
3. **Venda é fechada** → `/confirmar_venda` atualiza o lead e calcula comissões
4. **Dados são sincronizados** → Tudo aparece no site em tempo real

---

## 🔒 Segurança

- ✅ Todas as APIs estão públicas mas protegidas por RLS
- ✅ Edge functions usam Service Role Key (segura no backend)
- ✅ Validações em todas as entradas
- ✅ CORS habilitado para chamadas do bot

---

## 🚀 Próximos Passos

1. **Testar as APIs** com Postman ou Insomnia
2. **Integrar no bot** usando as funções acima
3. **Adicionar mais endpoints** se precisar (ex: editar afiliado, deletar, etc.)
4. **Customizar o design** do site se quiser

---

## 💬 Dúvidas?

Se precisar de ajuda para integrar ou quiser adicionar mais funcionalidades, é só me chamar! 🚀

---

**URL do Site:** Disponível na URL do seu projeto Lovable
**URL da API:** https://oyoifasethtkfkocppzs.supabase.co/functions/v1
