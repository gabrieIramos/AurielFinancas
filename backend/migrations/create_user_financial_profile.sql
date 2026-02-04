-- Migration: Criar tabela de perfil financeiro do usuário
-- Esta tabela armazena as respostas do formulário de perfil financeiro

CREATE TABLE IF NOT EXISTS user_financial_profile (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL UNIQUE REFERENCES "user"(id) ON DELETE CASCADE,
    
    -- Dados básicos
    age_range TEXT, -- '18-24', '25-34', '35-44', '45-54', '55-64', '65+'
    occupation TEXT, -- 'employed', 'self-employed', 'entrepreneur', 'student', 'retired', 'other'
    
    -- Renda
    monthly_income_range TEXT, -- 'up-to-2k', '2k-5k', '5k-10k', '10k-20k', '20k-50k', '50k+'
    income_stability TEXT, -- 'stable', 'variable', 'mostly-stable', 'mostly-variable'
    
    -- Despesas e dívidas
    monthly_expense_percentage TEXT, -- 'less-30', '30-50', '50-70', '70-90', 'more-90'
    has_debts BOOLEAN DEFAULT false,
    debt_types TEXT[], -- ['credit-card', 'personal-loan', 'financing', 'mortgage', 'student-loan', 'other']
    
    -- Reserva de emergência
    has_emergency_fund BOOLEAN DEFAULT false,
    emergency_fund_months TEXT, -- 'none', 'less-3', '3-6', '6-12', 'more-12'
    
    -- Investimentos
    investment_experience TEXT, -- 'none', 'beginner', 'intermediate', 'advanced'
    current_investments TEXT[], -- ['savings', 'cdb', 'tesouro', 'stocks', 'fiis', 'crypto', 'funds', 'other']
    investment_goal TEXT, -- 'emergency-fund', 'retirement', 'buy-property', 'financial-freedom', 'passive-income', 'other'
    investment_horizon TEXT, -- 'short-term', 'medium-term', 'long-term'
    
    -- Perfil de risco
    risk_tolerance TEXT, -- 'conservative', 'moderate', 'aggressive'
    
    -- Objetivos
    main_financial_goals TEXT[], -- ['save-more', 'invest-better', 'pay-debts', 'build-emergency', 'increase-income', 'retire-early', 'buy-house', 'travel']
    biggest_financial_challenge TEXT, -- 'control-spending', 'save-money', 'understand-investments', 'increase-income', 'pay-debts', 'organize-finances'
    
    -- Meta
    profile_completed BOOLEAN DEFAULT false,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índice para busca por usuário
CREATE INDEX IF NOT EXISTS idx_user_financial_profile_user_id ON user_financial_profile(user_id);

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_user_financial_profile_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_user_financial_profile_updated_at ON user_financial_profile;
CREATE TRIGGER trigger_update_user_financial_profile_updated_at
    BEFORE UPDATE ON user_financial_profile
    FOR EACH ROW
    EXECUTE FUNCTION update_user_financial_profile_updated_at();
