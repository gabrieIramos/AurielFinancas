import { betterAuth } from 'better-auth';
import { Pool } from 'pg';
import * as dotenv from 'dotenv';

dotenv.config();

// Connection string para Neon
const connectionString = `postgresql://${process.env.DATABASE_USER}:${process.env.DATABASE_PASSWORD}@${process.env.DATABASE_HOST}:${process.env.DATABASE_PORT}/${process.env.DATABASE_NAME}?sslmode=require`;

// Configuração do BetterAuth com PostgreSQL
export const auth = betterAuth({
  baseURL: process.env.BACKEND_URL || 'http://localhost:3000',
  database: new Pool({
    connectionString,
    ssl: {
      rejectUnauthorized: false,
    },
  }),
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false, 
  },
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      prompt: "select_account", // Sempre mostra a tela de seleção de conta
    },
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 dias
    updateAge: 60 * 60 * 24, // Atualiza a cada 24 horas
    cookieCache: {
      enabled: true,
      maxAge: 5 * 60, // Cache de 5 minutos
    },
  },
  advanced: {
    crossSubDomainCookies: {
      enabled: false, // Não necessário para localhost
    },
    defaultCookieAttributes: {
      sameSite: 'lax', // Permite cookies em requisições cross-origin
      secure: process.env.NODE_ENV === 'production', // HTTPS apenas em produção
      httpOnly: true,
      path: '/',
    },
  },
  user: {
    additionalFields: {
      fullName: {
        type: 'string',
        required: false,
      },
    },
  },
  trustedOrigins: [
    'http://localhost:5172',
    'http://localhost:5173',
    'http://localhost:3000',
    process.env.FRONTEND_URL || 'http://localhost:5172',
  ],
});

export type Session = typeof auth.$Infer.Session;
export type User = typeof auth.$Infer.Session.user;
