import { betterAuth } from 'better-auth';
import { Pool } from 'pg';
import * as dotenv from 'dotenv';

dotenv.config();

const connectionString = `postgresql://${process.env.DATABASE_USER}:${process.env.DATABASE_PASSWORD}@${process.env.DATABASE_HOST}:${process.env.DATABASE_PORT}/${process.env.DATABASE_NAME}?sslmode=verify-full`;

const isProduction = process.env.NODE_ENV === 'production';

export const auth = betterAuth({
  baseURL: process.env.BACKEND_URL || 'http://localhost:3000',
  
  trustedOrigins: [
    'http://localhost:5172',
    'http://localhost:5173',
    'http://localhost:3000',
    'https://aurielfinancas.app',           // ✅ Novo domínio root
    'https://www.aurielfinancas.app',       // ✅ Novo domínio www
    'https://api.aurielfinancas.app',       // ✅ Novo domínio API
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
      enabled: true,
    },
  },
  
  session: {
    expiresIn: 60 * 60 * 24 * 7,
    updateAge: 60 * 60 * 24,
    cookieCache: {
      enabled: true,
      maxAge: 5 * 60,
    },
  },
  
  advanced: {
    // 🎉 AGORA pode usar segurança máxima com domínio próprio!
    useSecureCookies: true,
    
    cookieOptions: {
      sameSite: 'lax',
      secure: true,
      httpOnly: true,
      path: '/',
      // 🔥 DOMÍNIO COMPARTILHADO - cookies funcionam entre api. e www.
      domain: isProduction ? '.aurielfinancas.app' : undefined,
    },
    
    crossSubDomainCookies: {
      enabled: false,
    },
    
    generateId: () => {
      return Math.random().toString(36).substring(2, 15) + 
             Math.random().toString(36).substring(2, 15);
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