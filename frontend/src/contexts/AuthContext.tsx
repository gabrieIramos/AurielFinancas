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
  isCheckingProfile: boolean;
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
  const [isCheckingProfile, setIsCheckingProfile] = useState(false);
  const [hasCheckedProfileOnce, setHasCheckedProfileOnce] = useState(false);
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
      setIsCheckingProfile(false);
    }
    setIsLoading(isPending);
  }, [session, isPending]);

  const checkFinancialProfile = async () => {
    if (!hasCheckedProfileOnce) {
      setIsCheckingProfile(true);
    }
    try {
      const response = await userService.checkFinancialProfile();
      if (response.data) {
        setHasFinancialProfile(response.data.hasProfile);
      }
    } catch (err) {
      console.error('Erro ao verificar perfil financeiro:', err);
      setHasFinancialProfile(false);
    } finally {
      setIsCheckingProfile(false);
      setHasCheckedProfileOnce(true);
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
    try {
      // Detecta se é mobile (iOS/Android)
      const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
      
      console.log('[OAuth] Iniciando login Google:', { isMobile, mode: isMobile ? 'redirect' : 'popup' });
      
      // Marca que iniciou login com Google (para recuperar após redirect)
      if (isMobile) {
        sessionStorage.setItem('oauth_in_progress', 'google');
        sessionStorage.setItem('oauth_timestamp', Date.now().toString());
      }
      
      // No iOS/Mobile usa redirect, desktop usa popup
      await signIn.social({
        provider: "google",
        callbackURL: window.location.origin + "/auth-callback",
        mode: isMobile ? "redirect" : "popup",
      });
      
      // Se chegou aqui em desktop (popup), login já foi processado
      // Em mobile (redirect), esta linha nunca executa pois página recarrega
      console.log('[OAuth] Login Google concluído (modo popup)');
      
      return true;
    } catch (err: any) {
      console.error('[OAuth] Erro login Google:', err);
      sessionStorage.removeItem('oauth_in_progress');
      sessionStorage.removeItem('oauth_timestamp');
      setError(err.message || "Erro ao fazer login com Google. Tente novamente.");
      return false;
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
        isCheckingProfile,
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
