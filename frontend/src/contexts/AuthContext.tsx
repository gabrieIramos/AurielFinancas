import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from "react";
import { authClient, signIn, signUp, signOut, useSession } from "../lib/auth-client";
import { userService } from "../services/user.service";

type User = {
  id: string;
  name: string;
  email: string;
  image?: string;
  hasFinancialProfile?: boolean;
};

type AuthContextType = {
  user: User | null;
  isAuthenticated: boolean;
  hasSeenOnboarding: boolean;
  hasFinancialProfile: boolean;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<boolean>;
  loginWithGoogle: () => Promise<boolean>;
  signup: (name: string, email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  completeOnboarding: () => void;
  completeFinancialProfile: () => void;
  clearError: () => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasFinancialProfile, setHasFinancialProfile] = useState(false);
  const [hasSeenOnboarding, setHasSeenOnboarding] = useState(() => {
    // Verifica se é a primeira visita ao site (não por usuário, mas pelo navegador)
    const seen = localStorage.getItem("hasSeenOnboarding");
    return seen === "true";
  });

  // Hook do BetterAuth para gerenciar sessão
  const { data: session, isPending } = useSession();

  // Atualiza o usuário quando a sessão mudar
  useEffect(() => {
    if (session?.user) {
      setUser({
        id: session.user.id,
        name: session.user.name,
        email: session.user.email,
        image: session.user.image || undefined,
      });
      
      // Verifica se o usuário tem perfil financeiro
      checkFinancialProfile();
    } else if (!isPending) {
      setUser(null);
      setHasFinancialProfile(false);
    }
    setIsLoading(isPending);
  }, [session, isPending]);

  const checkFinancialProfile = async () => {
    try {
      const response = await userService.checkFinancialProfile();
      if (response.data) {
        setHasFinancialProfile(response.data.hasProfile);
      }
    } catch (err) {
      console.error('Erro ao verificar perfil financeiro:', err);
    }
  };

  const logout = useCallback(async () => {
    try {
      await signOut();
      setUser(null);
    } catch (err) {
      console.error('Erro ao fazer logout:', err);
    }
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await signIn.email({
        email,
        password,
      });
      
      if (result.error) {
        setError(result.error.message || "Credenciais inválidas");
        return false;
      }

      if (result.data?.user) {
        setUser({
          id: result.data.user.id,
          name: result.data.user.name,
          email: result.data.user.email,
          image: result.data.user.image || undefined,
        });
        return true;
      }
      
      return false;
    } catch (err: any) {
      setError(err.message || "Erro ao fazer login. Tente novamente.");
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const loginWithGoogle = async (): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await signIn.social({
        provider: "google",
        callbackURL: window.location.origin,
      });
      
      if (result.error) {
        setError(result.error.message || "Erro ao fazer login com Google");
        return false;
      }

      // O redirecionamento será feito automaticamente
      return true;
    } catch (err: any) {
      setError(err.message || "Erro ao fazer login com Google. Tente novamente.");
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const signup = async (name: string, email: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await signUp.email({
        email,
        password,
        name,
        // Campo customizado
        fullName: name,
      });
      
      if (result.error) {
        setError(result.error.message || "Erro ao criar conta");
        return false;
      }

      if (result.data?.user) {
        setUser({
          id: result.data.user.id,
          name: result.data.user.name,
          email: result.data.user.email,
          image: result.data.user.image || undefined,
        });
        return true;
      }
      
      return false;
    } catch (err: any) {
      setError(err.message || "Erro ao criar conta. Tente novamente.");
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const completeOnboarding = () => {
    setHasSeenOnboarding(true);
    localStorage.setItem("hasSeenOnboarding", "true");
  };

  const completeFinancialProfile = () => {
    setHasFinancialProfile(true);
  };

  const clearError = () => {
    setError(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        hasSeenOnboarding,
        hasFinancialProfile,
        isLoading,
        error,
        login,
        loginWithGoogle,
        signup,
        logout,
        completeOnboarding,
        completeFinancialProfile,
        clearError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
