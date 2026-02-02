-- Migration: Criar tabelas do BetterAuth
-- As tabelas seguem o schema padrão do BetterAuth

-- Tabela de usuários do BetterAuth (separada da tabela users existente)
CREATE TABLE IF NOT EXISTS "auth_user" (
    "id" TEXT PRIMARY KEY,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL UNIQUE,
    "emailVerified" BOOLEAN NOT NULL DEFAULT FALSE,
    "image" TEXT,
    "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Tabela de sessões
CREATE TABLE IF NOT EXISTS "auth_session" (
    "id" TEXT PRIMARY KEY,
    "expiresAt" TIMESTAMP WITH TIME ZONE NOT NULL,
    "token" TEXT NOT NULL UNIQUE,
    "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "userId" TEXT NOT NULL REFERENCES "auth_user"("id") ON DELETE CASCADE
);

-- Tabela de contas (para OAuth providers como Google)
CREATE TABLE IF NOT EXISTS "auth_account" (
    "id" TEXT PRIMARY KEY,
    "accountId" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "userId" TEXT NOT NULL REFERENCES "auth_user"("id") ON DELETE CASCADE,
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

-- Tabela de verificação (para email verification, password reset, etc.)
CREATE TABLE IF NOT EXISTS "auth_verification" (
    "id" TEXT PRIMARY KEY,
    "identifier" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "expiresAt" TIMESTAMP WITH TIME ZONE NOT NULL,
    "createdAt" TIMESTAMP WITH TIME ZONE,
    "updatedAt" TIMESTAMP WITH TIME ZONE
);

-- Índices para melhor performance
CREATE INDEX IF NOT EXISTS "auth_session_userId_idx" ON "auth_session"("userId");
CREATE INDEX IF NOT EXISTS "auth_session_token_idx" ON "auth_session"("token");
CREATE INDEX IF NOT EXISTS "auth_account_userId_idx" ON "auth_account"("userId");
CREATE INDEX IF NOT EXISTS "auth_account_providerId_accountId_idx" ON "auth_account"("providerId", "accountId");

-- Adicionar coluna fullName à tabela auth_user (campo customizado)
ALTER TABLE "auth_user" ADD COLUMN IF NOT EXISTS "fullName" TEXT;

-- Criar view para compatibilidade com a estrutura existente
-- Isso permite que o resto da aplicação continue funcionando
CREATE OR REPLACE VIEW "users_view" AS
SELECT 
    au.id,
    COALESCE(au."fullName", au.name) as "fullName",
    au.email,
    aa.password as "passwordHash",
    au."createdAt" as "created_at"
FROM "auth_user" au
LEFT JOIN "auth_account" aa ON au.id = aa."userId" AND aa."providerId" = 'credential';

-- Função para sincronizar usuários do BetterAuth com a tabela users existente
-- Isso mantém compatibilidade com as relações existentes (accounts, transactions, etc.)
CREATE OR REPLACE FUNCTION sync_auth_user_to_users()
RETURNS TRIGGER AS $$
BEGIN
    -- Inserir ou atualizar na tabela users
    INSERT INTO users (id, full_name, email, password_hash, created_at)
    VALUES (
        NEW.id,
        COALESCE(NEW."fullName", NEW.name),
        NEW.email,
        '', -- Senha vazia para usuários OAuth, BetterAuth gerencia isso
        NEW."createdAt"
    )
    ON CONFLICT (id) DO UPDATE SET
        full_name = COALESCE(EXCLUDED.full_name, users.full_name),
        email = EXCLUDED.email;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para sincronizar automaticamente
DROP TRIGGER IF EXISTS sync_auth_user_trigger ON "auth_user";
CREATE TRIGGER sync_auth_user_trigger
AFTER INSERT OR UPDATE ON "auth_user"
FOR EACH ROW
EXECUTE FUNCTION sync_auth_user_to_users();
