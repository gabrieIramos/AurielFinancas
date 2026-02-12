# 🔧 CORREÇÃO: State Mismatch Error (iOS OAuth)

## 🐛 Problema:
```
State mismatch: State not persisted correctly
```

Esse erro ocorre quando o cookie de `state` do OAuth não é persistido corretamente entre:
1. Início do fluxo (criação do state)
2. Callback do Google (verificação do state)

### Causa Raiz:
- **iOS/Safari** bloqueia cookies third-party por padrão
- Cookies com `SameSite=None` podem ser bloqueados mesmo com `Secure=true`
- Domínios diferentes (Vercel frontend + Railway backend) pioram o problema

---

## ✅ Soluções Implementadas:

### 1️⃣ Backend - Cookies Mais Permissivos

**Antes:**
```typescript
sameSite: 'none', // Bloqueado no iOS
```

**Depois:**
```typescript
sameSite: 'lax',  // Mais compatível com iOS/Safari
useSecureCookies: true,
```

**Arquivo:** `backend/src/lib/auth.ts`

### 2️⃣ Frontend - SessionStorage Backup

Adicionado **fallback** usando `sessionStorage` para armazenar estado do OAuth:

```typescript
// Antes de iniciar OAuth
sessionStorage.setItem('oauth_in_progress', 'google');
sessionStorage.setItem('oauth_timestamp', Date.now().toString());

// Após callback
sessionStorage.removeItem('oauth_in_progress');
```

**Arquivo:** `frontend/src/contexts/AuthContext.tsx`

### 3️⃣ Callback Screen - Retry Logic

Adicionado **retry** com verificação direta da sessão:

- Tenta até 5x verificar se sessão foi criada
- Timeout de 5 minutos para OAuth
- Mensagens de erro detalhadas

**Arquivo:** `frontend/src/components/AuthCallbackScreen.tsx`

### 4️⃣ CORS - Headers Adicionais

```typescript
allowedHeaders: [
  'Content-Type', 
  'Authorization', 
  'Cookie',
  'Set-Cookie',      // ← Adicionado
  'X-Requested-With', // ← Adicionado
  'Accept',
  'Origin',
],
exposedHeaders: ['Set-Cookie'], // ← Adicionado
```

**Arquivo:** `backend/src/main.ts`

---

## 🧪 Como Testar:

### 1. Rebuild Backend:
```bash
cd backend
# Certifique-se que NODE_ENV=production no Railway
git add .
git commit -m "fix: State mismatch iOS - cookies lax + sessionStorage"
git push
```

### 2. Rebuild Frontend:
```bash
cd frontend
git add .
git commit -m "fix: SessionStorage fallback for OAuth state"
git push
```

### 3. Teste no iOS:
1. Abra Safari no iPhone/iPad
2. Limpe cookies: Settings → Safari → Clear History and Website Data
3. Acesse https://auriel-financas.vercel.app
4. Clique "Login com Google"
5. **Esperado:**
   - ✅ Redireciona para Google
   - ✅ Seleciona conta
   - ✅ Volta para app
   - ✅ Mostra "Autenticando..."
   - ✅ Redireciona para home logado
   - ❌ **NÃO** mostra erro de state

---

## 🔍 Debug no iOS:

### Safari Console (iPhone):
1. iPhone → Settings → Safari → Advanced → Web Inspector
2. Mac → Safari → Develop → [iPhone name] → [Site]
3. Verifique erros no console

### Logs Úteis:
```javascript
// Frontend
sessionStorage.getItem('oauth_in_progress')
sessionStorage.getItem('oauth_timestamp')

// Deve retornar 'google' e timestamp durante OAuth
```

### Backend Logs (Railway):
```bash
# Verifique logs no Railway dashboard
# Procure por:
- "State not found"
- "State mismatch"
- "Cookie not set"
```

---

## 📝 Checklist de Validação:

### Backend (Railway):
- [ ] `NODE_ENV=production`
- [ ] `BACKEND_URL=https://aurielfinancas-production.up.railway.app`
- [ ] `FRONTEND_URL=https://auriel-financas.vercel.app`
- [ ] Deploy completo sem erros

### Frontend (Vercel):
- [ ] `VITE_API_URL=https://aurielfinancas-production.up.railway.app`
- [ ] Deploy completo sem erros

### Google Console:
- [ ] Authorized redirect URIs: `https://aurielfinancas-production.up.railway.app/api/auth/callback/google`
- [ ] Authorized JavaScript origins: Ambos (frontend E backend)

### Teste:
- [ ] Desktop Chrome/Edge: Login Google (popup)
- [ ] Android Chrome: Login Google (redirect)
- [ ] iOS Safari: Login Google (redirect) ← **CRÍTICO**
- [ ] iOS PWA: Login Google (redirect)

---

## 🚨 Se Ainda Houver Erro:

### Opção A: Subdomínio Compartilhado

**Problema:** Domínios diferentes (vercel.app vs railway.app) dificultam cookies

**Solução:** Use custom domain:
```
app.seudominio.com → Frontend (Vercel)
api.seudominio.com → Backend (Railway)
```

**Vantagens:**
- ✅ Mesmo domínio base (.seudominio.com)
- ✅ Cookies funcionam melhor
- ✅ `SameSite=Lax` funciona perfeitamente

### Opção B: Backend na Mesma Plataforma

**Problema:** CORS entre plataformas diferentes

**Solução:** Deploy backend também no Vercel ou front no Railway
- Mesma plataforma = menos problemas de cookie

### Opção C: Auth Popup Forçado

**Solução:** Desabilitar redirect mode no iOS:
```typescript
// Em AuthContext.tsx
mode: "popup" // Sempre popup (não ideal no iOS)
```

⚠️ **Não recomendado:** Popup não fecha bem no iOS

---

## 📊 Melhorias Implementadas:

| Antes | Depois |
|-------|--------|
| `SameSite: none` | `SameSite: lax` |
| Sem fallback | SessionStorage backup |
| 1 tentativa callback | 5 tentativas com retry |
| Erro genérico | Mensagem detalhada |
| CORS básico | Headers completos |

---

## 🎯 Próximos Passos:

1. ✅ Deploy backend e frontend
2. ✅ Teste em **iPhone real** (não emulador)
3. ✅ Monitore logs no Railway
4. ⚠️ Se persistir: Considere custom domain

---

## 📚 Referências:

- [BetterAuth OAuth Docs](https://www.better-auth.com/docs/authentication/oauth)
- [Safari Cookie Policy](https://webkit.org/blog/10218/full-third-party-cookie-blocking-and-more/)
- [SameSite Cookies](https://web.dev/samesite-cookies-explained/)

---

**Status:** ✅ Implementado
**Prioridade:** 🔴 Alta
**Plataforma Afetada:** iOS/Safari

Teste agora e reporte o resultado! 🚀
