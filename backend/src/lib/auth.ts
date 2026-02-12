import { betterAuth } from 'better-auth';
import { Pool } from 'pg';
import * as dotenv from 'dotenv';

dotenv.config();

// Connection string para Neon
const connectionString = `postgresql://${process.env.DATABASE_USER}:${process.env.DATABASE_PASSWORD}@${process.env.DATABASE_HOST}:${process.env.DATABASE_PORT}/${process.env.DATABASE_NAME}?sslmode=require`;

export const auth = betterAuth({
  baseURL: process.env.BACKEND_URL || 'http://localhost:3000',
  trustedOrigins: [
    'http://localhost:5172',
    'http://localhost:5173',
    'http://localhost:3000',
    'https://auriel-financas.vercel.app',
    process.env.FRONTEND_URL || 'http://localhost:5172',
  ],
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
      redirectURI: `${process.env.BACKEND_URL || 'http://localhost:3000'}/api/auth/callback/google`,
      prompt: "select_account",
      accessType: "offline",
      callbackURL: `${process.env.FRONTEND_URL || 'http://localhost:5172'}/auth-callback`,
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
      enabled: false,
    },
    defaultCookieAttributes: {
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax', // 'none' para cross-domain em produção
      secure: process.env.NODE_ENV === 'production', // HTTPS obrigatório com sameSite='none'
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
});

export type Session = typeof auth.$Infer.Session;
export type User = typeof auth.$Infer.Session.user;
