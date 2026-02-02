import { createAuthClient } from "better-auth/react";

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export const authClient = createAuthClient({
  baseURL: API_URL,
});

// Exportar hooks e funções úteis
export const {
  signIn,
  signUp,
  signOut,
  useSession,
  getSession,
} = authClient;

// Tipos úteis
export type Session = typeof authClient.$Infer.Session;
export type User = typeof authClient.$Infer.Session.user;
