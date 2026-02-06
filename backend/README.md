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

