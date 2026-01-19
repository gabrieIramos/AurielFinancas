import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { authService, User as AuthUser } from "../services/auth.service";

type User = {
  id: string;
  name: string;
  email: string;
};

type AuthContextType = {
  user: User | null;
  isAuthenticated: boolean;
  hasSeenOnboarding: boolean;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<boolean>;
  signup: (name: string, email: string, password: string) => Promise<boolean>;
  logout: () => void;
  completeOnboarding: () => void;
  clearError: () => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasSeenOnboarding, setHasSeenOnboarding] = useState(() => {
    const seen = localStorage.getItem("hasSeenOnboarding");
    return seen === "true";
  });

  useEffect(() => {
    // Check if user is logged in
    const savedUser = authService.getUser();
    if (savedUser) {
      setUser({
        id: savedUser.id,
        name: savedUser.fullName,
        email: savedUser.email,
      });
    }
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await authService.login({ email, password });
      
      if (response.data) {
        setUser({
          id: response.data.user.id,
          name: response.data.user.fullName,
          email: response.data.user.email,
        });
        return true;
      } else if (response.error) {
        setError(response.error);
        return false;
      }
      return false;
    } catch (err) {
      setError("Erro ao fazer login. Tente novamente.");
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const signup = async (name: string, email: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await authService.register({ 
        fullName: name, 
        email, 
        password 
      });
      
      if (response.data) {
        setUser({
          id: response.data.user.id,
          name: response.data.user.fullName,
          email: response.data.user.email,
        });
        return true;
      } else if (response.error) {
        setError(response.error);
        return false;
      }
      return false;
    } catch (err) {
      setError("Erro ao criar conta. Tente novamente.");
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    authService.logout();
    setUser(null);
  };

  const completeOnboarding = () => {
    setHasSeenOnboarding(true);
    localStorage.setItem("hasSeenOnboarding", "true");
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
        isLoading,
        error,
        login,
        signup,
        logout,
        completeOnboarding,
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
