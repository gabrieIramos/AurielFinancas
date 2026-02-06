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

