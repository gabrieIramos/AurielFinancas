-- Criar tabela de histórico de patrimônio (se não existir)
-- Esta tabela armazena snapshots mensais do patrimônio do usuário

CREATE TABLE IF NOT EXISTS net_worth_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
    snapshot_date DATE NOT NULL,
    total_assets DECIMAL(15,2) NOT NULL DEFAULT 0,
    total_liabilities DECIMAL(15,2) NOT NULL DEFAULT 0,
    net_worth DECIMAL(15,2) NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Cada usuário só pode ter um snapshot por mês
    CONSTRAINT unique_user_month UNIQUE (user_id, snapshot_date)
);

-- Índice para buscar histórico por usuário ordenado por data
CREATE INDEX IF NOT EXISTS idx_net_worth_history_user_date 
ON net_worth_history(user_id, snapshot_date DESC);

-- Comentários
COMMENT ON TABLE net_worth_history IS 'Histórico mensal de patrimônio líquido dos usuários';
COMMENT ON COLUMN net_worth_history.snapshot_date IS 'Primeiro dia do mês do snapshot';
COMMENT ON COLUMN net_worth_history.total_assets IS 'Total de ativos (contas + investimentos)';
COMMENT ON COLUMN net_worth_history.total_liabilities IS 'Total de passivos (dívidas cartão de crédito)';
COMMENT ON COLUMN net_worth_history.net_worth IS 'Patrimônio líquido (ativos - passivos)';
