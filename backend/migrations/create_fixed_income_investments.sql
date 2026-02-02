-- Migration: Create fixed_income_investments table
-- Description: Table to store fixed income investments (CDB, Tesouro Direto, LCI, LCA, etc.)

CREATE TABLE IF NOT EXISTS fixed_income_investments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    type VARCHAR(50) NOT NULL,
    institution VARCHAR(255),
    invested_amount DECIMAL(18, 2) NOT NULL,
    current_amount DECIMAL(18, 2),
    interest_rate DECIMAL(8, 4) NOT NULL,
    indexer VARCHAR(20) NOT NULL,
    purchase_date DATE NOT NULL,
    maturity_date DATE,
    is_active BOOLEAN DEFAULT true,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for faster queries by user
CREATE INDEX IF NOT EXISTS idx_fixed_income_user_id ON fixed_income_investments(user_id);

-- Index for filtering active investments
CREATE INDEX IF NOT EXISTS idx_fixed_income_active ON fixed_income_investments(user_id, is_active);

-- Index for filtering by type
CREATE INDEX IF NOT EXISTS idx_fixed_income_type ON fixed_income_investments(user_id, type);

-- Add constraint for valid types
ALTER TABLE fixed_income_investments ADD CONSTRAINT check_fixed_income_type 
CHECK (type IN ('CDB', 'LCI', 'LCA', 'TESOURO_SELIC', 'TESOURO_PREFIXADO', 'TESOURO_IPCA', 'LC', 'DEBENTURE', 'CRI', 'CRA', 'POUPANCA'));

-- Add constraint for valid indexers
ALTER TABLE fixed_income_investments ADD CONSTRAINT check_fixed_income_indexer 
CHECK (indexer IN ('CDI', 'SELIC', 'IPCA', 'PREFIXADO', 'POUPANCA'));

-- Comment on table
COMMENT ON TABLE fixed_income_investments IS 'Stores user fixed income investments like CDB, Tesouro Direto, LCI, LCA, etc.';
