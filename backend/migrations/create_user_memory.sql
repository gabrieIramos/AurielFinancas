-- Migration: Criar tabela de memória contextual do usuário
-- Esta tabela armazena fatos relevantes extraídos das conversas com a IA

CREATE TABLE IF NOT EXISTS user_memory (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
    
    -- Fato relevante extraído
    fact TEXT NOT NULL,
    
    -- Categoria do fato
    -- Exemplos: 'finance', 'personal', 'goal', 'emergency', 'debt', 'family', 'health', 'career'
    category TEXT NOT NULL,
    
    -- Contexto adicional
    context TEXT,
    
    -- Score de relevância (0-100)
    relevance INTEGER DEFAULT 50,
    
    -- Sentimento associado
    -- Valores: 'positive', 'negative', 'neutral'
    sentiment TEXT,
    
    -- Data em que o fato ocorreu/foi mencionado
    event_date TIMESTAMP WITH TIME ZONE,
    
    -- Se o fato ainda é relevante
    is_active BOOLEAN DEFAULT true,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para otimizar buscas
CREATE INDEX IF NOT EXISTS idx_user_memory_user_id ON user_memory(user_id);
CREATE INDEX IF NOT EXISTS idx_user_memory_user_created ON user_memory(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_memory_category ON user_memory(category);
CREATE INDEX IF NOT EXISTS idx_user_memory_active ON user_memory(is_active) WHERE is_active = true;

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_user_memory_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_user_memory_updated_at ON user_memory;
CREATE TRIGGER trigger_update_user_memory_updated_at
    BEFORE UPDATE ON user_memory
    FOR EACH ROW
    EXECUTE FUNCTION update_user_memory_updated_at();
