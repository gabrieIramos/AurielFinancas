import { useEffect, useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useTheme } from "../contexts/ThemeContext";

export default function AuthCallbackScreen() {
  const { theme } = useTheme();
  const { isAuthenticated } = useAuth();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Aguarda um pouco para garantir que o cookie foi setado
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Verifica se está autenticado
        const checkAuth = async () => {
          // Força reload para pegar a sessão
          window.location.href = "/";
        };

        if (isAuthenticated) {
          setStatus("success");
          setTimeout(() => {
            window.location.href = "/";
          }, 1000);
        } else {
          // Tenta novamente após um delay
          setTimeout(checkAuth, 1500);
        }
      } catch (error) {
        console.error("Callback error:", error);
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
                className={`text-sm ${
                  theme === "dark" ? "text-zinc-400" : "text-zinc-600"
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
