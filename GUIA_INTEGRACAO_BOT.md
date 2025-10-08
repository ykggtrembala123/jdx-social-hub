# 🤖 Guia de Integração - Bot Discord

## 📋 Informações Essenciais

### Credenciais Supabase
```javascript
const SUPABASE_URL = 'https://oyoifasethtkfkocppzs.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im95b2lmYXNldGh0a2Zrb2NwcHpzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk2NjAxMTYsImV4cCI6MjA3NTIzNjExNn0.mu7kO3i-H4eTjM9omkOPgRz0zJTqDP5n_9Pmxmzimiw';
```

### URL do Site
```
https://seu-projeto.lovable.app
```

---

## 🎯 Comandos do Bot

### 1. `/meus-ganhos` - Ver Estatísticas Pessoais

**Descrição**: Mostra os ganhos e estatísticas do afiliado

**Código Completo**:
```javascript
// Comando para ver ganhos do afiliado
client.on('interactionCreate', async (interaction) => {
  if (!interaction.isCommand()) return;
  
  if (interaction.commandName === 'meus-ganhos') {
    try {
      const discordId = interaction.user.id;
      
      // Chama a edge function
      const response = await fetch(`${SUPABASE_URL}/functions/v1/get-affiliate-by-discord-id`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
        },
        body: JSON.stringify({ discordUserId: discordId })
      });
      
      if (!response.ok) {
        throw new Error('Afiliado não encontrado');
      }
      
      const data = await response.json();
      
      // Cria embed com as informações
      const embed = new EmbedBuilder()
        .setColor('#00D9FF')
        .setTitle(`💰 Ganhos de ${data.name}`)
        .setDescription(`**Código**: ${data.code} | **Tier**: ${getTierEmoji(data.tier)} ${data.tier.toUpperCase()}`)
        .addFields(
          { name: '💵 Total de Ganhos', value: `R$ ${data.total_earnings.toFixed(2)}`, inline: true },
          { name: '⏳ Ganhos Pendentes', value: `R$ ${(data.pending_earnings || 0).toFixed(2)}`, inline: true },
          { name: '💎 Ganhos em Cascata', value: `R$ ${(data.total_cascade_earnings || 0).toFixed(2)}`, inline: true },
          { name: '📊 Total de Leads', value: `${data.total_leads}`, inline: true },
          { name: '✅ Total de Vendas', value: `${data.total_sales}`, inline: true },
          { name: '🎯 Comissão', value: `${data.commission}%`, inline: true },
          { name: '👥 Sub-Afiliados', value: `${data.sub_affiliates_count || 0}`, inline: true }
        )
        .setFooter({ text: `Acesse seu dashboard completo em: ${SITE_URL}/auth` })
        .setTimestamp();
      
      await interaction.reply({ embeds: [embed], ephemeral: true });
      
    } catch (error) {
      console.error('Erro ao buscar ganhos:', error);
      await interaction.reply({ 
        content: '❌ Erro ao buscar seus ganhos. Você está cadastrado como afiliado?', 
        ephemeral: true 
      });
    }
  }
});

// Função auxiliar para emojis de tier
function getTierEmoji(tier) {
  const emojis = {
    'bronze': '🥉',
    'prata': '🥈',
    'ouro': '🥇',
    'diamante': '💎'
  };
  return emojis[tier] || '🥈';
}
```

---

### 2. `/criar-lead` - Criar Novo Lead (Admin)

**Descrição**: Cria um novo lead no sistema

**Parâmetros**:
- `codigo_afiliado` (string): Código do afiliado (ex: AFF001)
- `ticket_id` (string): ID do ticket
- `valor` (number): Valor da transação
- `cliente` (string): Nome do cliente (opcional)

**Código Completo**:
```javascript
client.on('interactionCreate', async (interaction) => {
  if (!interaction.isCommand()) return;
  
  if (interaction.commandName === 'criar-lead') {
    try {
      // Verifica se é admin
      const isAdmin = await checkIfAdmin(interaction.user.id);
      if (!isAdmin) {
        return interaction.reply({ 
          content: '❌ Apenas administradores podem criar leads.', 
          ephemeral: true 
        });
      }
      
      const affiliateCode = interaction.options.getString('codigo_afiliado');
      const ticketId = interaction.options.getString('ticket_id');
      const value = interaction.options.getNumber('valor');
      const clientName = interaction.options.getString('cliente') || 'Cliente';
      
      // Chama a edge function
      const response = await fetch(`${SUPABASE_URL}/functions/v1/create-lead`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
        },
        body: JSON.stringify({
          affiliate_code: affiliateCode,
          ticket_id: ticketId,
          transaction_value: value,
          client_name: clientName
        })
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Erro ao criar lead');
      }
      
      const data = await response.json();
      
      const embed = new EmbedBuilder()
        .setColor('#00FF00')
        .setTitle('✅ Lead Criado com Sucesso!')
        .addFields(
          { name: '🎫 Ticket ID', value: ticketId, inline: true },
          { name: '👤 Afiliado', value: affiliateCode, inline: true },
          { name: '💵 Valor', value: `R$ ${value.toFixed(2)}`, inline: true },
          { name: '🧑 Cliente', value: clientName, inline: true },
          { name: '💰 Comissão', value: `R$ ${data.lead.affiliate_commission.toFixed(2)}`, inline: true },
          { name: '📊 Status', value: '⏳ Pendente', inline: true }
        )
        .setTimestamp();
      
      await interaction.reply({ embeds: [embed] });
      
    } catch (error) {
      console.error('Erro ao criar lead:', error);
      await interaction.reply({ 
        content: `❌ Erro ao criar lead: ${error.message}`, 
        ephemeral: true 
      });
    }
  }
});

// Função para verificar se é admin
async function checkIfAdmin(discordId) {
  try {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/check-admin`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
      },
      body: JSON.stringify({ discordId })
    });
    
    const data = await response.json();
    return data.isAdmin || false;
  } catch {
    return false;
  }
}
```

---

### 3. `/confirmar-venda` - Confirmar Venda (Admin)

**Descrição**: Confirma uma venda e credita comissões

**Parâmetros**:
- `ticket_id` (string): ID do ticket a confirmar

**Código Completo**:
```javascript
client.on('interactionCreate', async (interaction) => {
  if (!interaction.isCommand()) return;
  
  if (interaction.commandName === 'confirmar-venda') {
    try {
      // Verifica se é admin
      const isAdmin = await checkIfAdmin(interaction.user.id);
      if (!isAdmin) {
        return interaction.reply({ 
          content: '❌ Apenas administradores podem confirmar vendas.', 
          ephemeral: true 
        });
      }
      
      const ticketId = interaction.options.getString('ticket_id');
      
      // Chama a edge function
      const response = await fetch(`${SUPABASE_URL}/functions/v1/confirm-sale`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
        },
        body: JSON.stringify({ ticket_id: ticketId })
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Erro ao confirmar venda');
      }
      
      const data = await response.json();
      
      const embed = new EmbedBuilder()
        .setColor('#00FF00')
        .setTitle('✅ Venda Confirmada!')
        .setDescription(`A venda do ticket **${ticketId}** foi confirmada com sucesso.`)
        .addFields(
          { name: '💰 Comissões Creditadas', value: 'As comissões foram automaticamente creditadas aos afiliados.' }
        )
        .setTimestamp();
      
      await interaction.reply({ embeds: [embed] });
      
    } catch (error) {
      console.error('Erro ao confirmar venda:', error);
      await interaction.reply({ 
        content: `❌ Erro ao confirmar venda: ${error.message}`, 
        ephemeral: true 
      });
    }
  }
});
```

---

### 4. `/solicitar-saque` - Solicitar Saque

**Descrição**: Afiliado solicita um saque

**Parâmetros**:
- `valor` (number): Valor do saque
- `metodo` (string): Método de pagamento (PIX, TED, etc)
- `chave_pix` (string): Chave PIX ou dados bancários

**Código Completo**:
```javascript
client.on('interactionCreate', async (interaction) => {
  if (!interaction.isCommand()) return;
  
  if (interaction.commandName === 'solicitar-saque') {
    try {
      const discordId = interaction.user.id;
      
      // Busca dados do afiliado
      const affiliateResponse = await fetch(`${SUPABASE_URL}/functions/v1/get-affiliate-by-discord-id`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
        },
        body: JSON.stringify({ discordUserId: discordId })
      });
      
      if (!affiliateResponse.ok) {
        throw new Error('Afiliado não encontrado');
      }
      
      const affiliate = await affiliateResponse.json();
      
      const amount = interaction.options.getNumber('valor');
      const method = interaction.options.getString('metodo');
      const paymentAddress = interaction.options.getString('chave_pix');
      
      // Valida saldo
      if (amount > affiliate.total_earnings) {
        return interaction.reply({
          content: `❌ Saldo insuficiente. Você tem R$ ${affiliate.total_earnings.toFixed(2)} disponível.`,
          ephemeral: true
        });
      }
      
      // Cria solicitação de saque
      const response = await fetch(`${SUPABASE_URL}/functions/v1/request-withdrawal`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
        },
        body: JSON.stringify({
          affiliate_code: affiliate.code,
          amount: amount,
          payment_method: method,
          payment_address: paymentAddress
        })
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Erro ao solicitar saque');
      }
      
      const embed = new EmbedBuilder()
        .setColor('#FFD700')
        .setTitle('💰 Solicitação de Saque Enviada')
        .setDescription('Sua solicitação foi enviada e será analisada em breve.')
        .addFields(
          { name: '💵 Valor', value: `R$ ${amount.toFixed(2)}`, inline: true },
          { name: '🏦 Método', value: method, inline: true },
          { name: '🔑 Chave/Dados', value: paymentAddress, inline: false },
          { name: '📊 Status', value: '⏳ Pendente', inline: true }
        )
        .setFooter({ text: 'Você receberá uma notificação quando o saque for processado.' })
        .setTimestamp();
      
      await interaction.reply({ embeds: [embed], ephemeral: true });
      
    } catch (error) {
      console.error('Erro ao solicitar saque:', error);
      await interaction.reply({ 
        content: `❌ Erro ao solicitar saque: ${error.message}`, 
        ephemeral: true 
      });
    }
  }
});
```

---

### 5. `/afiliado-info` - Ver Info de Afiliado (Admin)

**Descrição**: Admin visualiza informações de qualquer afiliado

**Parâmetros**:
- `codigo` (string): Código do afiliado

**Código Completo**:
```javascript
client.on('interactionCreate', async (interaction) => {
  if (!interaction.isCommand()) return;
  
  if (interaction.commandName === 'afiliado-info') {
    try {
      // Verifica se é admin
      const isAdmin = await checkIfAdmin(interaction.user.id);
      if (!isAdmin) {
        return interaction.reply({ 
          content: '❌ Apenas administradores podem ver informações de afiliados.', 
          ephemeral: true 
        });
      }
      
      const code = interaction.options.getString('codigo');
      
      // Chama a edge function
      const response = await fetch(`${SUPABASE_URL}/functions/v1/get-affiliate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
        },
        body: JSON.stringify({ code })
      });
      
      if (!response.ok) {
        throw new Error('Afiliado não encontrado');
      }
      
      const data = await response.json();
      
      const embed = new EmbedBuilder()
        .setColor('#00D9FF')
        .setTitle(`📊 Informações - ${data.name}`)
        .addFields(
          { name: '🔖 Código', value: data.code, inline: true },
          { name: '🎭 Discord ID', value: data.discord_user_id, inline: true },
          { name: '🏆 Tier', value: `${getTierEmoji(data.tier)} ${data.tier.toUpperCase()}`, inline: true },
          { name: '💵 Total Ganho', value: `R$ ${data.total_earnings.toFixed(2)}`, inline: true },
          { name: '⏳ Pendente', value: `R$ ${(data.pending_earnings || 0).toFixed(2)}`, inline: true },
          { name: '💎 Cascata', value: `R$ ${(data.total_cascade_earnings || 0).toFixed(2)}`, inline: true },
          { name: '📊 Leads', value: `${data.total_leads}`, inline: true },
          { name: '✅ Vendas', value: `${data.total_sales}`, inline: true },
          { name: '🎯 Comissão', value: `${data.commission}%`, inline: true },
          { name: '👥 Sub-Afiliados', value: `${data.sub_affiliates_count || 0}`, inline: true },
          { name: '👤 Indicado por', value: data.referred_by || 'Nenhum', inline: true }
        )
        .setTimestamp();
      
      await interaction.reply({ embeds: [embed] });
      
    } catch (error) {
      console.error('Erro ao buscar afiliado:', error);
      await interaction.reply({ 
        content: `❌ Erro: ${error.message}`, 
        ephemeral: true 
      });
    }
  }
});
```

---

## 📝 Registro de Comandos

**Adicione isso ao seu arquivo de deploy de comandos**:

```javascript
const commands = [
  {
    name: 'meus-ganhos',
    description: 'Ver suas estatísticas e ganhos como afiliado'
  },
  {
    name: 'criar-lead',
    description: '[ADMIN] Criar um novo lead',
    options: [
      {
        name: 'codigo_afiliado',
        type: 3, // STRING
        description: 'Código do afiliado (ex: AFF001)',
        required: true
      },
      {
        name: 'ticket_id',
        type: 3, // STRING
        description: 'ID do ticket',
        required: true
      },
      {
        name: 'valor',
        type: 10, // NUMBER
        description: 'Valor da transação',
        required: true
      },
      {
        name: 'cliente',
        type: 3, // STRING
        description: 'Nome do cliente',
        required: false
      }
    ]
  },
  {
    name: 'confirmar-venda',
    description: '[ADMIN] Confirmar uma venda e creditar comissões',
    options: [
      {
        name: 'ticket_id',
        type: 3, // STRING
        description: 'ID do ticket a confirmar',
        required: true
      }
    ]
  },
  {
    name: 'solicitar-saque',
    description: 'Solicitar um saque dos seus ganhos',
    options: [
      {
        name: 'valor',
        type: 10, // NUMBER
        description: 'Valor do saque',
        required: true
      },
      {
        name: 'metodo',
        type: 3, // STRING
        description: 'Método de pagamento (PIX, TED, etc)',
        required: true
      },
      {
        name: 'chave_pix',
        type: 3, // STRING
        description: 'Chave PIX ou dados bancários',
        required: true
      }
    ]
  },
  {
    name: 'afiliado-info',
    description: '[ADMIN] Ver informações de um afiliado',
    options: [
      {
        name: 'codigo',
        type: 3, // STRING
        description: 'Código do afiliado',
        required: true
      }
    ]
  }
];

// Registrar comandos
const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);

(async () => {
  try {
    console.log('Registrando comandos...');
    await rest.put(
      Routes.applicationCommands(process.env.CLIENT_ID),
      { body: commands }
    );
    console.log('✅ Comandos registrados com sucesso!');
  } catch (error) {
    console.error(error);
  }
})();
```

---

## 🔧 Configuração do .env

```env
DISCORD_TOKEN=seu_token_do_bot
CLIENT_ID=seu_client_id
SUPABASE_URL=https://oyoifasethtkfkocppzs.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im95b2lmYXNldGh0a2Zrb2NwcHpzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk2NjAxMTYsImV4cCI6MjA3NTIzNjExNn0.mu7kO3i-H4eTjM9omkOPgRz0zJTqDP5n_9Pmxmzimiw
SITE_URL=https://seu-projeto.lovable.app
```

---

## ✅ Checklist de Implementação

- [ ] Configurar credenciais Supabase no .env
- [ ] Registrar todos os comandos do bot
- [ ] Implementar `/meus-ganhos`
- [ ] Implementar `/criar-lead`
- [ ] Implementar `/confirmar-venda`
- [ ] Implementar `/solicitar-saque`
- [ ] Implementar `/afiliado-info`
- [ ] Testar cada comando individualmente
- [ ] Adicionar tratamento de erros
- [ ] Configurar mensagens de sucesso/erro

---

## 🎯 Próximos Passos

1. Copie todos os códigos acima
2. Configure o .env com suas credenciais
3. Registre os comandos
4. Teste cada comando
5. Ajuste mensagens conforme necessário

**Bot pronto para integração! 🚀**
