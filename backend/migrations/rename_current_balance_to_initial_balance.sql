-- Migration: Rename current_balance to initial_balance in accounts table
-- Date: 2026-01-21

-- Renomear a coluna current_balance para initial_balance
ALTER TABLE accounts RENAME COLUMN current_balance TO initial_balance;

-- Opcional: Se quiser resetar os saldos iniciais para 0
-- UPDATE accounts SET initial_balance = 0;
