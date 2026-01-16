# Endpoints do Backend Esperados pelo Frontend

## Status dos Endpoints

### ✅ Autenticação (Implementado)
- `POST /auth/login` - Login
- `POST /auth/register` - Registro

### ⚠️ Patrimônio Líquido (Parcialmente Implementado)
O frontend tenta esses endpoints. **Se não existirem, o frontend usará fallbacks:**

1. **GET `/net-worth`** (Preferido)
   - Response: `{ value: number, change: number, changePercentage: number }`
   - Se falhar: retorna 0

2. **GET `/net-worth/history?months=6`** (Preferido)
   - Response: `{ current: number, history: Array<{date, value, change, changePercentage}> }`
   - Se falhar: retorna array vazio

### ⚠️ Investimentos (Parcialmente Implementado)
- `GET /investments` ✅ (Implementado e funcionando)
- `POST /investments` ✅ (Implementado e funcionando)
- `PUT /investments/:id` ✅ (Implementado e funcionando)
- `DELETE /investments/:id` ✅ (Implementado e funcionando)

**Endpoint com fallback:**
- `GET /investments/portfolio/summary`
  - Response preferido: `{ allocation: Array<{type, total}>, total: number, totalInvested: number }`
  - Se falhar: calcula a partir de `GET /investments`

### ✅ Transações (Implementado)
- `GET /transactions` - Lista de transações
- `POST /transactions` - Criar transação
- `PUT /transactions/:id` - Atualizar transação
- `DELETE /transactions/:id` - Deletar transação

### ✅ Categorias (Implementado)
- `GET /categories` - Lista de categorias

### ⚠️ IA/Insights (Com Fallback)
- `GET /ai/insights` - Insights de IA
- `GET /ai/recommendations` - Recomendações

Se retornarem erros, o frontend mostra dados vazios.

---

## Recomendações para o Backend

### Priority 1: Implementar ou Correção de Autorização
1. Verificar se o token Bearer está sendo enviado corretamente
2. Testar: `curl -H "Authorization: Bearer TOKEN" http://localhost:3000/transactions`

### Priority 2: Implementar Endpoints Faltantes
1. `/net-worth` - Calcular patrimônio total (investimentos + contas + carteiras)
2. `/net-worth/history?months=X` - Histórico de patrimônio
3. `/investments/portfolio/summary` - Resumo da carteira

### Priority 3: Dados de Teste
Crie alguns dados de teste no banco:
```sql
-- Adicionar uma transação de teste
INSERT INTO transactions (userId, description, amount, type, category, date) 
VALUES (1, 'Teste', 100, 'income', 'salary', NOW());

-- Adicionar um investimento de teste
INSERT INTO investments (userId, name, ticker, type, quantity, averagePrice) 
VALUES (1, 'Itaú', 'ITUB4', 'Ação', 10, 25.50);
```

---

## Comportamento Atual do Frontend

✅ **Com dados no backend**: Exibe dados normalmente
✅ **Sem dados no backend**: Exibe valores padrão (0, arrays vazios)
✅ **Com erro 401**: Pode ser token expirado ou não enviado
✅ **Com erro 404**: Usa fallback ou dados padrão

**O aplicativo continua funcionando mesmo sem dados**, mostrando placeholders vazios.
