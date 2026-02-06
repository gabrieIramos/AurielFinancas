-- Migration: Adicionar campo variacao_dia na tabela ativo
-- Este campo armazena a variação percentual do dia (regularMarketChangePercent da BRAPI)

ALTER TABLE ativo
ADD COLUMN variacao_dia NUMERIC(10, 2) DEFAULT 0;

-- Comentário para documentação
COMMENT ON COLUMN ativo.variacao_dia IS 'Variação percentual do preço do ativo no dia (atualizado via BRAPI)';
