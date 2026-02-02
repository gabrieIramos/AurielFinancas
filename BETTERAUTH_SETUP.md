# Configuração do BetterAuth

Este documento explica como configurar a autenticação com BetterAuth na aplicação, incluindo login com email/senha e Google OAuth.

## Instalação

As dependências já foram adicionadas ao projeto:

**Backend:**
```bash
cd backend
npm install better-auth
```

**Frontend:**
```bash
cd frontend
npm install better-auth
```

## Configuração do Google OAuth

### 1. Criar um projeto no Google Cloud Console

1. Acesse [Google Cloud Console](https://console.cloud.google.com/)
2. Crie um novo projeto ou selecione um existente
3. Vá para **APIs & Services** > **Credentials**
4. Clique em **Create Credentials** > **OAuth Client ID**
5. Configure a tela de consentimento OAuth se necessário
6. Selecione **Web application** como tipo de aplicação
7. Adicione as seguintes URLs:

**Authorized JavaScript origins:**
- `http://localhost:3000` (desenvolvimento backend)
- `http://localhost:5173` (desenvolvimento frontend)
- Sua URL de produção

**Authorized redirect URIs:**
- `http://localhost:3000/api/auth/callback/google`
- Sua URL de produção + `/api/auth/callback/google`

8. Copie o **Client ID** e **Client Secret**

### 2. Configurar variáveis de ambiente

No arquivo `.env` do backend, adicione:

```env
# Google OAuth
GOOGLE_CLIENT_ID=seu-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=seu-client-secret

# BetterAuth
BETTER_AUTH_SECRET=uma-chave-secreta-forte-aqui
BETTER_AUTH_URL=http://localhost:3000

# Frontend URL (para redirecionamentos)
FRONTEND_URL=http://localhost:5173
```

## Executar a Migration do Banco de Dados

Execute a migration para criar as tabelas necessárias do BetterAuth:

```bash
# Conecte ao PostgreSQL e execute:
psql -U postgres -d gestao_financeira -f migrations/create_better_auth_tables.sql
```

Ou via TypeORM (se preferir):

```bash
npm run typeorm migration:run
```

## Estrutura de Arquivos

### Backend

- `src/lib/auth.ts` - Configuração principal do BetterAuth
- `src/modules/auth/better-auth.controller.ts` - Controller que expõe as rotas do BetterAuth
- `src/modules/auth/guards/better-auth.guard.ts` - Guard para proteger rotas autenticadas

### Frontend

- `src/lib/auth-client.ts` - Cliente BetterAuth para React
- `src/contexts/AuthContext.tsx` - Context atualizado com suporte a Google OAuth

## Uso

### Login com Email/Senha

```tsx
const { login } = useAuth();

const handleLogin = async () => {
  const success = await login(email, password);
  if (success) {
    // Redirecionar para home
  }
};
```

### Login com Google

```tsx
const { loginWithGoogle } = useAuth();

const handleGoogleLogin = async () => {
  await loginWithGoogle();
  // O usuário será redirecionado para o Google
  // Após autenticação, retornará automaticamente
};
```

### Cadastro com Email/Senha

```tsx
const { signup } = useAuth();

const handleSignup = async () => {
  const success = await signup(name, email, password);
  if (success) {
    // Conta criada com sucesso
  }
};
```

### Logout

```tsx
const { logout } = useAuth();

const handleLogout = async () => {
  await logout();
};
```

## Protegendo Rotas no Backend

Use o `BetterAuthGuard` para proteger rotas:

```typescript
import { Controller, Get, UseGuards } from '@nestjs/common';
import { BetterAuthGuard } from '../auth/guards/better-auth.guard';

@Controller('protected')
export class ProtectedController {
  @Get()
  @UseGuards(BetterAuthGuard)
  getProtectedData(@Request() req) {
    // req.user contém os dados do usuário autenticado
    return { user: req.user };
  }
}
```

## Notas Importantes

1. **Compatibilidade**: O sistema mantém compatibilidade com a tabela `users` existente através de um trigger que sincroniza automaticamente os dados.

2. **Sessões**: O BetterAuth usa cookies HTTP-only para gerenciar sessões, o que é mais seguro que armazenar tokens no localStorage.

3. **CORS**: Certifique-se de que o CORS está configurado corretamente para permitir credenciais (cookies).

4. **Produção**: Em produção, sempre use HTTPS e configure as URLs corretas nas variáveis de ambiente.
