-- Migration: Configurar BetterAuth
-- Renomeia tabela accounts (contas bancárias) para bank_accounts para evitar conflito

-- 1. Renomear tabela accounts para bank_accounts (contas bancárias)
ALTER TABLE IF EXISTS "accounts" RENAME TO "bank_accounts";

-- 2. Renomear tabela users para old_users (backup)
ALTER TABLE IF EXISTS "users" RENAME TO "old_users";

-- 3. Criar tabelas do BetterAuth (nomes padrão)

-- Tabela de usuários 
CREATE TABLE IF NOT EXISTS "user" (
    "id" TEXT PRIMARY KEY,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL UNIQUE,
    "emailVerified" BOOLEAN NOT NULL DEFAULT FALSE,
    "image" TEXT,
    "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    "fullName" TEXT
);

-- Tabela de sessões
CREATE TABLE IF NOT EXISTS "session" (
    "id" TEXT PRIMARY KEY,
    "expiresAt" TIMESTAMP WITH TIME ZONE NOT NULL,
    "token" TEXT NOT NULL UNIQUE,
    "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "userId" TEXT NOT NULL REFERENCES "user"("id") ON DELETE CASCADE
);

-- Tabela de contas OAuth (Google, etc)
CREATE TABLE IF NOT EXISTS "account" (
    "id" TEXT PRIMARY KEY,
    "accountId" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "userId" TEXT NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
    "accessToken" TEXT,
    "refreshToken" TEXT,
    "idToken" TEXT,
    "accessTokenExpiresAt" TIMESTAMP WITH TIME ZONE,
    "refreshTokenExpiresAt" TIMESTAMP WITH TIME ZONE,
    "scope" TEXT,
    "password" TEXT,
    "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Tabela de verificação
CREATE TABLE IF NOT EXISTS "verification" (
    "id" TEXT PRIMARY KEY,
    "identifier" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "expiresAt" TIMESTAMP WITH TIME ZONE NOT NULL,
    "createdAt" TIMESTAMP WITH TIME ZONE,
    "updatedAt" TIMESTAMP WITH TIME ZONE
);

-- 4. Índices
CREATE INDEX IF NOT EXISTS "session_userId_idx" ON "session"("userId");
CREATE INDEX IF NOT EXISTS "session_token_idx" ON "session"("token");
CREATE INDEX IF NOT EXISTS "account_userId_idx" ON "account"("userId");

-- 5. Atualizar FK na tabela bank_accounts (antiga accounts)
ALTER TABLE "bank_accounts" DROP CONSTRAINT IF EXISTS "accounts_user_id_fkey";
ALTER TABLE "bank_accounts" DROP CONSTRAINT IF EXISTS "fk_accounts_user";

-- 6. Atualizar FK em outras tabelas que referenciam users
ALTER TABLE "transactions" DROP CONSTRAINT IF EXISTS "transactions_user_id_fkey";
ALTER TABLE "transactions" DROP CONSTRAINT IF EXISTS "fk_transactions_user";

ALTER TABLE "investments" DROP CONSTRAINT IF EXISTS "investments_user_id_fkey";
ALTER TABLE "investments" DROP CONSTRAINT IF EXISTS "fk_investments_user";

ALTER TABLE "net_worth_history" DROP CONSTRAINT IF EXISTS "net_worth_history_user_id_fkey";
ALTER TABLE "net_worth_history" DROP CONSTRAINT IF EXISTS "fk_net_worth_history_user";

-- 7. Migrar usuários existentes da old_users para user (BetterAuth)
INSERT INTO "user" ("id", "name", "email", "emailVerified", "createdAt", "updatedAt", "fullName")
SELECT 
    id::text, 
    full_name, 
    email, 
    true, 
    created_at, 
    created_at,
    full_name
FROM "old_users"
ON CONFLICT (email) DO NOTHING;

-- 8. Migrar senhas para a tabela account (credential provider)
INSERT INTO "account" ("id", "accountId", "providerId", "userId", "password", "createdAt", "updatedAt")
SELECT 
    gen_random_uuid()::text,
    email,
    'credential',
    id::text,
    password_hash,
    created_at,
    created_at
FROM "old_users"
WHERE password_hash IS NOT NULL AND password_hash != ''
ON CONFLICT DO NOTHING;

-- 9. Recriar FKs apontando para nova tabela user (o id agora é TEXT)
-- Primeiro, alterar o tipo da coluna user_id nas tabelas relacionadas
ALTER TABLE "bank_accounts" ALTER COLUMN "user_id" TYPE TEXT;
ALTER TABLE "transactions" ALTER COLUMN "user_id" TYPE TEXT;
ALTER TABLE "investments" ALTER COLUMN "user_id" TYPE TEXT;
ALTER TABLE "net_worth_history" ALTER COLUMN "user_id" TYPE TEXT;

-- Agora criar as FKs
ALTER TABLE "bank_accounts" ADD CONSTRAINT "fk_bank_accounts_user" 
    FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE;

ALTER TABLE "transactions" ADD CONSTRAINT "fk_transactions_user" 
    FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE;

ALTER TABLE "investments" ADD CONSTRAINT "fk_investments_user" 
    FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE;

ALTER TABLE "net_worth_history" ADD CONSTRAINT "fk_net_worth_history_user" 
    FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE;

-- 10. Opcional: Remover tabela old_users após confirmar que tudo funciona
-- DROP TABLE IF EXISTS "old_users";
