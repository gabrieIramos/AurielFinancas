-- Migration: Adicionar user_id à tabela ai_category_cache
-- Permite cache de categorias por usuário (prioridade sobre cache global)

-- 1. Remover constraint unique antiga (se existir)
ALTER TABLE ai_category_cache DROP CONSTRAINT IF EXISTS ai_category_cache_description_clean_key;
ALTER TABLE ai_category_cache DROP CONSTRAINT IF EXISTS "UQ_ai_category_cache_description_clean";

-- 2. Adicionar coluna user_id (nullable = cache global)
ALTER TABLE ai_category_cache 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES users(id) ON DELETE CASCADE;

-- 3. Renomear coluna is_global para is_user_defined (inverte a lógica)
-- is_user_defined = true significa que o usuário definiu manualmente (alta confiança)
ALTER TABLE ai_category_cache 
RENAME COLUMN is_global TO is_user_defined;

-- 4. Inverter valores existentes (is_global=true -> is_user_defined=false)
UPDATE ai_category_cache SET is_user_defined = NOT is_user_defined;

-- 5. Criar índice composto único (description_clean + user_id)
-- Permite: mesmo description_clean para usuários diferentes + 1 global (user_id = null)
CREATE UNIQUE INDEX IF NOT EXISTS idx_ai_category_cache_desc_user 
ON ai_category_cache (description_clean, COALESCE(user_id, '00000000-0000-0000-0000-000000000000'));

-- 6. Índice para busca rápida por usuário
CREATE INDEX IF NOT EXISTS idx_ai_category_cache_user_id 
ON ai_category_cache (user_id) WHERE user_id IS NOT NULL;

-- 7. Índice para busca rápida de cache global
CREATE INDEX IF NOT EXISTS idx_ai_category_cache_global 
ON ai_category_cache (description_clean) WHERE user_id IS NULL;
