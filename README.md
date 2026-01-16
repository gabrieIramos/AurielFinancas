# 💰 App de Gestão Financeira & Investimentos Inteligente

Um sistema web pessoal projetado para consolidar finanças diárias (contas e cartões) e carteira de investimentos (ações, FIIs, renda fixa) em um único local, utilizando automação via arquivos **OFX** e **Inteligência Artificial**.

---

## 🚀 Visão Geral e Pilares

O objetivo principal é oferecer uma ferramenta de alta fidelidade com o menor esforço manual possível, focando no crescimento do patrimônio líquido e utilizando tecnologias *open-source* com custo operacional zero.

* **Esforço Manual Mínimo:** Automação via upload de arquivos OFX e classificação por IA.
* **Visão de Patrimônio Líquido:** Monitoramento real do crescimento (Ativos - Passivos).
* **Custo Zero:** Arquitetura baseada em camadas gratuitas (PostgreSQL, Groq Free Tier).

---

## 🛠️ Módulos e Funcionalidades

### 1. Dashboard Inicial (Torre de Comando)
* **KPIs:** Patrimônio Total, Saldo Disponível e Fatura Acumulada.
* **Gráficos:** Evolução de Receitas vs. Despesas e Alocação de Ativos.
* **Feed Recente:** Resumo das últimas movimentações importadas.

### 2. Gestão Financeira (Módulo OFX)
* **Deduplicação Inteligente:** Motor baseado em Hash Único para evitar duplicidade entre diferentes importações e bancos.
* **Conciliação Bancária:** Identificação automática de transferências entre contas próprias (Ex: Inter -> Nubank).
* **Categorização via IA:** Uso de LLMs para limpar descrições bancárias e categorizar gastos com **Cache de Inteligência**.

### 3. Gestão de Investimentos
* **Cotações Automáticas:** Integração com API Brapi para ativos da B3.
* **Análise de Carteira:** Preço médio, rentabilidade e diversificação por setor.

### 4. Camada de IA (Groq)
* **Relatórios:** Analista financeiro que gera insights mensais.
* **Chat de Dados:** Interface em linguagem natural para perguntar sobre seus gastos.

---

## 🏗️ Stack Tecnológica

* **Frontend:** React + Tailwind CSS + Tremor.
* **Backend:** Node.js.
* **Banco de Dados:** PostgreSQL Nativo.
* **IA:** Groq (Free Tier com modelo mixtral-8x7b-32768).
* **APIs Externas:** Brapi (Investimentos).

---

## 🗄️ Esquema do Banco de Dados (PostgreSQL)

```sql
-- Habilita geração de UUIDs
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. USUÁRIOS E CONTAS
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    full_name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE institutions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL, 
    bank_code TEXT, 
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE accounts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    institution_id UUID REFERENCES institutions(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    type VARCHAR(50) CHECK (type IN ('CONTA_CORRENTE', 'CARTAO_DE_CREDITO', 'INVESTIMENTO')),
    current_balance DECIMAL(15, 2) DEFAULT 0.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. TRANSAÇÕES E CATEGORIAS
CREATE TABLE categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT UNIQUE NOT NULL,
    color VARCHAR(20) DEFAULT '#808080',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
    fitid TEXT, 
    transaction_hash TEXT UNIQUE NOT NULL, 
    description_raw TEXT NOT NULL, 
    description_clean TEXT,        
    amount DECIMAL(15, 2) NOT NULL, 
    date DATE NOT NULL,
    category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
    category_confidence DECIMAL(3, 2), 
    needs_review BOOLEAN DEFAULT TRUE, 
    transfer_id UUID REFERENCES transactions(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_trans_recon_search ON transactions (amount, date, user_id);

-- 3. CACHE DE INTELIGÊNCIA
CREATE TABLE ai_category_cache (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    description_clean TEXT NOT NULL,
    category_id UUID NOT NULL
        REFERENCES categories(id) ON DELETE CASCADE,
    user_id UUID NULL
        REFERENCES users(id) ON DELETE CASCADE,
    source TEXT NOT NULL CHECK (source IN ('user', 'ia', 'bank')),
    confidence_score DECIMAL(3, 2),
    occurrence_count INTEGER DEFAULT 1,
    is_global BOOLEAN DEFAULT FALSE,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);


-- 4. INVESTIMENTOS E PATRIMÔNIO
CREATE TABLE investments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    ticker VARCHAR(20) NOT NULL, 
    type VARCHAR(50) NOT NULL, 
    quantity DECIMAL(18, 8) DEFAULT 0,
    average_price DECIMAL(18, 2) DEFAULT 0,
    current_price DECIMAL(18, 2) DEFAULT 0,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE net_worth_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    snapshot_date DATE NOT NULL,
    total_assets DECIMAL(15, 2) NOT NULL,
    total_liabilities DECIMAL(15, 2) NOT NULL,
    net_worth DECIMAL(15, 2) NOT NULL,
    UNIQUE(user_id, snapshot_date)
);