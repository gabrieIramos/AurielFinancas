# Backend - Gestão Financeira & Investimentos

Backend NestJS para aplicação de gestão financeira pessoal com IA.

## 🚀 Início Rápido

### Pré-requisitos
- Node.js 18+
- PostgreSQL 14+
- npm ou yarn

### Instalação

```bash
# Instalar dependências
npm install

# Copiar arquivo de ambiente
cp .env.example .env

# Editar .env e configurar credenciais do banco e chave da API Groq
```

### Executar

```bash
# Desenvolvimento
npm run start:dev

# Produção
npm run build
npm run start:prod
```

## 📚 Documentação da API

Acesse `http://localhost:3000/api/docs` para a documentação Swagger completa.

## 🔑 Variáveis de Ambiente

```env
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USER=postgres
DATABASE_PASSWORD=your_password
DATABASE_NAME=gestao_financeira

JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=7d

GROQ_API_KEY=your-groq-api-key
```

## 🏗️ Estrutura

```
src/
├── modules/
│   ├── auth/          # Autenticação JWT
│   ├── users/         # Usuários
│   ├── accounts/      # Contas bancárias
│   ├── transactions/  # Transações com deduplicação
│   ├── categories/    # Categorias
│   ├── investments/   # Investimentos
	│   ├── ai/           # IA (Groq)
│   └── net-worth/    # Patrimônio líquido
├── app.module.ts
└── main.ts
```

## 🤖 Funcionalidades de IA

- **Categorização Automática**: Groq categoriza transações
- **Cache Inteligente**: Reutiliza categorizações anteriores
- **Limpeza de Descrições**: Remove ruído de extratos bancários
- **Relatórios Mensais**: Análises geradas por IA

## 🔒 Segurança

- JWT com expiração configurável
- Bcrypt para hash de senhas
- Validação de entrada com class-validator
- Guards do Passport para rotas protegidas
