-- Migration: Corrigir tipo de user_id nas tabelas
-- O BetterAuth usa TEXT para IDs, não UUID

-- 1. Remover FKs existentes
ALTER TABLE "bank_accounts" DROP CONSTRAINT IF EXISTS "fk_bank_accounts_user";
ALTER TABLE "transactions" DROP CONSTRAINT IF EXISTS "fk_transactions_user";
ALTER TABLE "investments" DROP CONSTRAINT IF EXISTS "fk_investments_user";
ALTER TABLE "net_worth_history" DROP CONSTRAINT IF EXISTS "fk_net_worth_history_user";
ALTER TABLE "fixed_income_investments" DROP CONSTRAINT IF EXISTS "fk_fixed_income_user";
ALTER TABLE "ai_category_cache" DROP CONSTRAINT IF EXISTS "ai_category_cache_user_id_fkey";

-- 2. Alterar tipo da coluna user_id para TEXT em todas as tabelas
ALTER TABLE "bank_accounts" ALTER COLUMN "user_id" TYPE TEXT USING user_id::TEXT;
ALTER TABLE "transactions" ALTER COLUMN "user_id" TYPE TEXT USING user_id::TEXT;
ALTER TABLE "investments" ALTER COLUMN "user_id" TYPE TEXT USING user_id::TEXT;
ALTER TABLE "net_worth_history" ALTER COLUMN "user_id" TYPE TEXT USING user_id::TEXT;
ALTER TABLE "fixed_income_investments" ALTER COLUMN "user_id" TYPE TEXT USING user_id::TEXT;
ALTER TABLE "ai_category_cache" ALTER COLUMN "user_id" TYPE TEXT USING user_id::TEXT;

-- 3. Recriar as FKs
ALTER TABLE "bank_accounts" ADD CONSTRAINT "fk_bank_accounts_user" 
    FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE;

ALTER TABLE "transactions" ADD CONSTRAINT "fk_transactions_user" 
    FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE;

ALTER TABLE "investments" ADD CONSTRAINT "fk_investments_user" 
    FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE;

ALTER TABLE "net_worth_history" ADD CONSTRAINT "fk_net_worth_history_user" 
    FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE;

ALTER TABLE "fixed_income_investments" ADD CONSTRAINT "fk_fixed_income_user" 
    FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE;

-- Recriar FK para ai_category_cache (nullable)
ALTER TABLE "ai_category_cache" ADD CONSTRAINT "ai_category_cache_user_id_fkey" 
    FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE;
