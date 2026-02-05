-- Migration: Add broker column to investments table
-- Description: Adds a column to store the broker (corretora) for each investment transaction

-- Add broker column to investments table
ALTER TABLE investments 
ADD COLUMN IF NOT EXISTS broker VARCHAR(100) NULL;

-- Add comment to the column
COMMENT ON COLUMN investments.broker IS 'Nome da corretora onde a transação foi realizada';
