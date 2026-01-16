# App de Gerenciamento Financeiro

Uma aplicação completa de gerenciamento financeiro com frontend React e backend NestJS.

## 🚀 Funcionalidades

- ✅ **Autenticação**: Login e cadastro de usuários
- 📊 **Dashboard**: Visão geral do patrimônio e finanças
- 💰 **Transações**: Registro e visualização de receitas e despesas
- 📈 **Carteira**: Gerenciamento de investimentos
- 🤖 **IA Financeira**: Insights e recomendações personalizadas
- 👤 **Perfil**: Gerenciamento de conta e preferências
- 🌓 **Tema**: Modo claro e escuro

## 📋 Pré-requisitos

- Node.js (v16 ou superior)
- npm ou yarn
- Backend rodando na porta 3000

## 🔧 Instalação e Configuração

### Backend

1. Navegue até a pasta do backend:
```bash
cd backend
```

2. Instale as dependências:
```bash
npm install
```

3. Configure as variáveis de ambiente (crie um arquivo `.env` baseado em `.env.example`)

4. Execute as migrations do banco de dados (se necessário)

5. Inicie o servidor:
```bash
npm run start:dev
```

O backend estará rodando em `http://localhost:3000`

### Frontend

1. Navegue até a pasta do frontend:
```bash
cd frontend
```

2. Instale as dependências:
```bash
npm install
```

3. O arquivo `.env` já está configurado para apontar para `http://localhost:3000`

4. Inicie o servidor de desenvolvimento:
```bash
npm run dev
```

O frontend estará rodando em `http://localhost:5173`

## 🎯 Como Usar

1. **Primeiro Acesso**: 
   - Ao abrir o aplicativo, você verá a tela de login/cadastro
   - Crie uma nova conta ou faça login com uma conta existente

2. **Navegação**:
   - Use a barra inferior para navegar entre as telas
   - **Home**: Visão geral do patrimônio e resumo financeiro
   - **Extrato**: Lista de todas as transações
   - **Carteira**: Gerenciamento de investimentos
   - **IA**: Insights e recomendações financeiras
   - **Perfil**: Configurações e informações da conta

3. **Funcionalidades Principais**:
   - Adicione transações no Extrato
   - Adicione ativos na Carteira
   - Visualize insights de IA
   - Alterne entre modo claro/escuro no Perfil
   - Faça logout no Perfil

## 🏗️ Estrutura do Projeto

### Frontend
```
frontend/
├── src/
│   ├── components/          # Componentes React
│   │   ├── ui/             # Componentes de UI reutilizáveis
│   │   ├── HomeScreen.tsx
│   │   ├── ExtratoScreen.tsx
│   │   ├── CarteiraScreen.tsx
│   │   ├── IAScreen.tsx
│   │   ├── PerfilScreen.tsx
│   │   └── LoginScreen.tsx
│   ├── contexts/           # Contextos React (Auth, Theme)
│   ├── services/           # Serviços de API
│   └── App.tsx            # Componente principal
```

### Backend
```
backend/
├── src/
│   ├── modules/
│   │   ├── auth/          # Autenticação
│   │   ├── users/         # Usuários
│   │   ├── transactions/  # Transações
│   │   ├── investments/   # Investimentos
│   │   ├── ai/           # IA e insights
│   │   └── ...
│   └── main.ts
```

## 🔐 Autenticação

O sistema usa JWT (JSON Web Tokens) para autenticação:
- O token é armazenado no localStorage
- Todas as requisições incluem o token no header Authorization
- O logout limpa o token e recarrega a aplicação

## 🎨 Temas

O aplicativo suporta modo claro e escuro:
- A preferência é salva no localStorage
- Pode ser alternada na tela de Perfil

## 📱 Responsividade

O aplicativo foi desenvolvido com foco em dispositivos móveis (max-width: 430px), mas também funciona em desktops.

## 🛠️ Tecnologias Utilizadas

### Frontend
- React 18
- TypeScript
- Vite
- TailwindCSS
- Radix UI
- Recharts (gráficos)
- Lucide Icons

### Backend
- NestJS
- TypeScript
- PostgreSQL/MySQL
- Passport JWT
- Swagger

## 📝 Notas Importantes

1. **API URL**: Certifique-se de que a URL da API no arquivo `.env` está correta
2. **CORS**: O backend deve permitir requisições do frontend (já configurado)
3. **Dados Iniciais**: Em desenvolvimento, você pode precisar criar dados iniciais manualmente

## 🐛 Troubleshooting

### Backend não conecta
- Verifique se o backend está rodando na porta 3000
- Verifique as configurações do banco de dados

### Erro de autenticação
- Limpe o localStorage do navegador
- Faça logout e login novamente

### Dados não carregam
- Verifique o console do navegador para erros
- Verifique se o backend está respondendo corretamente

## 📄 Licença

Este projeto é privado e destinado apenas para fins educacionais.
