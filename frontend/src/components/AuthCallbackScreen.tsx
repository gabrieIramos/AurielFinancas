import { useEffect, useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useTheme } from "../contexts/ThemeContext";

export default function AuthCallbackScreen() {
  const { theme } = useTheme();
  const { isAuthenticated } = useAuth();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [errorMessage, setErrorMessage] = useState<string>("");

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Verifica se há erro na URL (vindo do backend)
        const urlParams = new URLSearchParams(window.location.search);
        const errorParam = urlParams.get('error');
        
        if (errorParam) {
          console.error('OAuth error from URL:', errorParam);
          
          // Limpa OAuth markers
          sessionStorage.removeItem('oauth_in_progress');
          sessionStorage.removeItem('oauth_timestamp');
          
          // Define mensagem baseada no erro
          let message = 'Erro na autenticação.';
          if (errorParam === 'state_mismatch') {
            message = 'Erro de segurança (state mismatch). Cookies podem estar bloqueados. Tente novamente.';
          } else if (errorParam === 'access_denied') {
            message = 'Acesso negado. Você cancelou a autenticação.';
          }
          
          setErrorMessage(message);
          setStatus("error");
          setTimeout(() => {
            window.location.href = "/";
          }, 4000);
          return;
        }
        
        // Verifica se há OAuth em progresso
        const oauthInProgress = sessionStorage.getItem('oauth_in_progress');
        const oauthTimestamp = sessionStorage.getItem('oauth_timestamp');
        
        // Verifica se o OAuth expirou (mais de 5 minutos)
        if (oauthTimestamp) {
          const elapsed = Date.now() - parseInt(oauthTimestamp);
          if (elapsed > 5 * 60 * 1000) {
            console.error('OAuth timeout');
            sessionStorage.removeItem('oauth_in_progress');
            sessionStorage.removeItem('oauth_timestamp');
            setErrorMessage('Timeout na autenticação. Tente novamente.');
            setStatus("error");
            setTimeout(() => {
              window.location.href = "/";
            }, 2000);
            return;
          }
        }

        // Aguarda processamento do callback
        await new Promise(resolve => setTimeout(resolve, 1500));

        // Tenta buscar a sessão diretamente
        const checkSession = async (attempts = 0): Promise<boolean> => {
          if (attempts > 5) return false;
          
          try {
            const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/auth/session`, {
              credentials: 'include',
              headers: {
                'Accept': 'application/json',
              },
            });
            
            if (response.ok) {
              const data = await response.json();
              if (data?.user) {
                return true;
              }
            }
          } catch (err) {
            console.error('Session check error:', err);
          }
          
          // Retry após delay
          await new Promise(resolve => setTimeout(resolve, 1000));
          return checkSession(attempts + 1);
        };

        const sessionExists = await checkSession();
        
        if (sessionExists || isAuthenticated) {
          // Limpa OAuth markers
          sessionStorage.removeItem('oauth_in_progress');
          sessionStorage.removeItem('oauth_timestamp');
          
          setStatus("success");
          setTimeout(() => {
            window.location.href = "/";
          }, 800);
        } else {
          setErrorMessage('Não foi possível confirmar a autenticação.');
          setStatus("error");
          setTimeout(() => {
            window.location.href = "/";
          }, 2000);
        }
      } catch (error) {
        console.error("Callback error:", error);
        sessionStorage.removeItem('oauth_in_progress');
        sessionStorage.removeItem('oauth_timestamp');
        setErrorMessage('Erro no processo de autenticação.');
        setStatus("error");
        setTimeout(() => {
          window.location.href = "/";
        }, 2000);
      }
    };

    handleCallback();
  }, [isAuthenticated]);

  return (
    <div className={theme === "dark" ? "dark" : ""}>
      <div
        className={`min-h-screen flex items-center justify-center ${
          theme === "dark" ? "bg-black" : "bg-white"
        }`}
      >
        <div className="text-center px-6">
          {status === "loading" && (
            <>
              <div className="w-16 h-16 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <h2
                className={`text-xl font-semibold mb-2 ${
                  theme === "dark" ? "text-white" : "text-zinc-900"
                }`}
              >
                Autenticando...
              </h2>
              <p
                className={`text-sm ${
                  theme === "dark" ? "text-zinc-400" : "text-zinc-600"
                }`}
              >
                Você será redirecionado em instantes
              </p>
            </>
          )}

          {status === "success" && (
            <>
              <div className="w-16 h-16 bg-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-8 h-8 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <h2
                className={`text-xl font-semibold mb-2 ${
                  theme === "dark" ? "text-white" : "text-zinc-900"
                }`}
              >
                Login realizado!
              </h2>
              <p
                className={`text-sm ${
                  theme === "dark" ? "text-zinc-400" : "text-zinc-600"
                }`}
              >
                Redirecionando...
              </p>
            </>
          )}

          {status === "error" && (
            <>
              <div className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-8 h-8 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </div>
              <h2
                className={`text-xl font-semibold mb-2 ${
                  theme === "dark" ? "text-white" : "text-zinc-900"
                }`}
              >
                Erro na autenticação
              </h2>
              <p
                className={`text-sm mb-2 ${
                  theme === "dark" ? "text-zinc-400" : "text-zinc-600"
                }`}
              >
                {errorMessage || "Erro desconhecido"}
              </p>
              <p
                className={`text-xs ${
                  theme === "dark" ? "text-zinc-500" : "text-zinc-500"
                }`}
              >
                Redirecionando para a tela de login...
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
