# Sistema de Autenticação e Dashboards - Vultos Swap

## 📋 Visão Geral

O sistema implementa autenticação completa com dashboards diferenciados para administradores e afiliados individuais, além de configurações dinâmicas para comissões e taxas.

## 🔐 Autenticação

### Tipos de Usuário

**Admin:**
- Acesso total ao sistema
- Pode criar e gerenciar afiliados
- Visualiza todos os afiliados no Dashboard Administrativo
- Pode configurar comissões e taxas dinamicamente

**Afiliado:**
- Acesso ao dashboard individual
- Visualiza apenas seus próprios dados
- Vê seus leads, sub-afiliados e ganhos
- Pode solicitar saques

### Configuração Inicial

1. **Criar conta de Admin:**
   - Acesse `/auth`
   - Crie uma conta com email e senha
   - Por padrão, a conta será criada como "affiliate"

2. **Atualizar perfil para Admin:**
   ```sql
   -- Execute no backend do Lovable Cloud
   UPDATE profiles 
   SET role = 'admin' 
   WHERE id = '[ID_DO_USUARIO]';
   ```

3. **Vincular afiliado a um usuário:**
   ```sql
   UPDATE profiles 
   SET affiliate_code = '[CODIGO_AFILIADO]'
   WHERE id = '[ID_DO_USUARIO]';
   ```

## 🎯 Dashboards

### Dashboard Administrativo (`/admin` ou `/`)

Acessível apenas para usuários com role `admin`:

- **Estatísticas Globais:**
  - Total de afiliados
  - Total de leads do sistema
  - Total de ganhos do sistema

- **Lista de Afiliados:**
  - Grid com cards de todos os afiliados
  - Busca por código ou nome
  - Ordenação por ganhos (maior para menor)
  - Acesso rápido aos detalhes de cada afiliado

- **Ações:**
  - Criar novo afiliado
  - Ver detalhes de qualquer afiliado
  - Gerenciar sistema completo

### Dashboard do Afiliado (`/dashboard`)

Acessível para usuários com role `affiliate`:

- **Informações do Afiliado:**
  - Código de afiliado (com botão para copiar)
  - Tier atual
  - Comissão configurada

- **Estatísticas Individuais:**
  - Leads gerados
  - Vendas confirmadas
  - Total ganho
  - Número de sub-afiliados

- **Performance:**
  - Taxa de conversão
  - Ganhos pendentes
  - Ganhos de cascata

- **Sub-Afiliados:**
  - Lista de todos os afiliados que indicou
  - Métricas de cada sub-afiliado
  - Total de vendas e leads dos sub-afiliados

- **Leads Recentes:**
  - Últimos 10 leads gerados
  - Status de cada lead
  - Valor da comissão

## ⚙️ Configurações Dinâmicas

### Tabela `system_config`

Armazena configurações que podem ser alteradas sem modificar código:

| Key | Valor Padrão | Descrição |
|-----|--------------|-----------|
| `default_affiliate_commission` | 30 | Comissão padrão (%) |
| `default_cascade_commission` | 5 | Comissão cascata fixa (%) |
| `min_transaction_fee` | 5 | Taxa mínima transação (%) |
| `max_transaction_fee` | 20 | Taxa máxima transação (%) |
| `bronze_commission` | 30 | Comissão tier Bronze (%) |
| `prata_commission` | 30 | Comissão tier Prata (%) |
| `ouro_commission` | 40 | Comissão tier Ouro (%) |
| `diamante_commission` | 50 | Comissão tier Diamante (%) |

### Atualizar Configurações

```sql
-- Exemplo: Alterar comissão do tier Diamante para 55%
UPDATE system_config 
SET value = 55 
WHERE key = 'diamante_commission';
```

### Edge Function `get-system-config`

Retorna todas as configurações em formato objeto:

```typescript
// Resposta da função
{
  "default_affiliate_commission": 30,
  "default_cascade_commission": 5,
  "min_transaction_fee": 5,
  "max_transaction_fee": 20,
  "bronze_commission": 30,
  "prata_commission": 30,
  "ouro_commission": 40,
  "diamante_commission": 50
}
```

**Uso no Bot Discord:**
```javascript
// No início do bot ou periodicamente
const response = await fetch(`${SUPABASE_URL}/functions/v1/get-system-config`, {
  headers: { 'apikey': SUPABASE_ANON_KEY }
});
const config = await response.json();

// Usar as configurações
const affiliateCommission = config.default_affiliate_commission;
const cascadeCommission = config.default_cascade_commission;
```

## 🔄 Fluxo de Uso

### Para Admin:

1. Login em `/auth`
2. Redirecionado para Dashboard Administrativo
3. Cria afiliados via `/create-affiliate`
4. Monitora performance geral
5. Acessa detalhes de qualquer afiliado
6. Gerencia configurações do sistema

### Para Afiliado:

1. Admin cria conta e vincula código de afiliado
2. Afiliado faz login em `/auth`
3. Redirecionado para Dashboard Individual
4. Visualiza seus dados e métricas
5. Copia código de afiliado para divulgar
6. Monitora leads e sub-afiliados
7. Solicita saques dos ganhos

## 🛡️ Segurança

### Row Level Security (RLS)

**Tabela `profiles`:**
- Usuários podem ler apenas seu próprio perfil
- Usuários podem atualizar apenas seu próprio perfil
- Service role pode inserir novos perfis

**Tabela `system_config`:**
- Todos podem ler configurações
- Apenas service role pode atualizar

### Proteção de Rotas

- Rotas protegidas requerem autenticação
- Rotas admin requerem role `admin`
- Redirecionamentos automáticos baseados em permissões

## 📱 Integrações

### Bot Discord

O bot deve buscar configurações dinamicamente:

```javascript
// Função auxiliar para obter configs
async function getSystemConfig() {
  try {
    const response = await fetch(
      `${process.env.SUPABASE_URL}/functions/v1/get-system-config`,
      {
        headers: {
          'apikey': process.env.SUPABASE_ANON_KEY,
          'Content-Type': 'application/json'
        }
      }
    );
    return await response.json();
  } catch (error) {
    console.error('Error fetching system config:', error);
    // Fallback para valores padrão
    return {
      default_affiliate_commission: 30,
      default_cascade_commission: 5,
      min_transaction_fee: 5,
      max_transaction_fee: 20
    };
  }
}

// Usar no início do bot
let systemConfig = await getSystemConfig();

// Atualizar periodicamente (ex: a cada hora)
setInterval(async () => {
  systemConfig = await getSystemConfig();
}, 3600000); // 1 hora
```

## 🚀 Próximas Melhorias (Opcionais)

- [ ] Interface administrativa para gerenciar configurações
- [ ] Gráficos de evolução de ganhos
- [ ] Notificações em tempo real para afiliados
- [ ] Histórico de mudanças nas configurações
- [ ] Exportação de relatórios
- [ ] Dashboard analytics avançado
- [ ] Sistema de notificações por email
- [ ] Integração com OAuth do Discord

## 📝 Observações

- **Email Confirmation:** Desabilitado para facilitar testes (auto_confirm_email = true)
- **Senha Mínima:** 6 caracteres
- **Session Persistence:** Habilitado via localStorage
- **Auto Refresh Token:** Habilitado automaticamente
