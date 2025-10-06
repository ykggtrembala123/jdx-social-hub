# Sistema de Solicitação de Saque - Vultos Swap

## 📋 Visão Geral

O sistema de saque permite que afiliados solicitem o pagamento de seus ganhos através do dashboard web. Quando uma solicitação é criada, uma notificação é enviada automaticamente para um canal do Discord via webhook.

## 🔧 Configuração da Webhook do Discord

### 1. Criar a Webhook no Discord

1. Abra o Discord e vá para o servidor da Vultos Swap
2. Clique com o botão direito no canal onde deseja receber as notificações de saque
3. Selecione **Editar Canal** > **Integrações** > **Webhooks**
4. Clique em **Nova Webhook**
5. Dê um nome (ex: "Notificações de Saque")
6. Copie a URL da webhook

### 2. Adicionar a Webhook como Secret no Supabase

A webhook precisa ser configurada como um secret no Lovable Cloud:

1. Use o comando no chat do Lovable:
```
Por favor, adicione um secret chamado DISCORD_WEBHOOK_URL
```

2. Cole a URL da webhook quando solicitado

## 💰 Como Funciona

### Para o Afiliado:

1. Acesse a página de detalhes do afiliado: `/affiliate/[CODIGO]`
2. Na seção **Solicitar Saque**, clique em **💰 Sacar Ganhos**
3. Preencha:
   - Valor do saque (deve ser menor ou igual ao saldo disponível)
   - Método de pagamento (PIX ou Crypto)
   - Chave PIX ou endereço crypto
4. Clique em **Solicitar Saque**

### Notificação no Discord:

Quando uma solicitação é criada, uma embed é enviada para o canal configurado contendo:

- 👤 **Nome e username do afiliado**
- 🔢 **Código do afiliado**
- 💵 **Valor solicitado**
- 💳 **Método de pagamento** (PIX ou Crypto)
- 📧 **Chave PIX ou endereço crypto**
- 📊 **Métricas do afiliado:**
  - Total de ganhos acumulados
  - Total de vendas confirmadas
  - Total de leads gerados
  - Número de sub-afiliados
  - Ganhos de cascata
  - Tier atual

### Para o Admin:

1. Receba a notificação no Discord
2. Verifique as informações do afiliado
3. Realize o pagamento manualmente via PIX ou crypto
4. Atualize o status da solicitação no banco de dados:

```sql
UPDATE withdrawal_requests 
SET status = 'completed', 
    processed_at = NOW(),
    notes = 'Pago via PIX/Crypto'
WHERE id = '[ID_DA_SOLICITACAO]';
```

Ou para rejeitar:

```sql
UPDATE withdrawal_requests 
SET status = 'rejected', 
    processed_at = NOW(),
    notes = 'Motivo da rejeição'
WHERE id = '[ID_DA_SOLICITACAO]';
```

## 📊 Status das Solicitações

As solicitações podem ter os seguintes status:

- 🟡 **pending** - Aguardando processamento
- 🟢 **approved** - Aprovado (opcional, antes de pagar)
- ✅ **completed** - Pagamento realizado
- ❌ **rejected** - Solicitação rejeitada

## 🔍 Histórico de Saques

O afiliado pode visualizar o histórico completo de suas solicitações de saque na seção **Histórico de Saques**, incluindo:

- Valor solicitado
- Data da solicitação
- Método e endereço de pagamento
- Status atual
- Observações (se houver)

## 🎯 Recursos Implementados

✅ Tabela `withdrawal_requests` com RLS policies  
✅ Edge Function `request-withdrawal` para criar solicitações  
✅ Integração com webhook do Discord  
✅ Interface no dashboard para solicitar saques  
✅ Histórico completo de solicitações  
✅ Validações de saldo e campos obrigatórios  
✅ Notificação rica com todas as métricas do afiliado  
✅ Índices no banco para melhor performance  

## 🚀 Próximas Melhorias (Opcionais)

- [ ] Painel administrativo para gerenciar solicitações
- [ ] Notificação para o afiliado quando saque for processado
- [ ] Limite mínimo para saque
- [ ] Taxas de saque (se aplicável)
- [ ] Comprovante de pagamento em PDF
- [ ] Dashboard com análise de saques mensais

## 📝 Observações Importantes

- **Segurança:** A webhook do Discord não deve ser compartilhada publicamente
- **Validações:** O sistema valida se o afiliado tem saldo suficiente antes de criar a solicitação
- **Backup:** Mantenha um registro das solicitações para auditoria
- **Comunicação:** Sempre notifique o afiliado após processar a solicitação
