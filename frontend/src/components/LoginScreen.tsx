import { useState } from "react";
import { motion } from "motion/react";
import { ArrowLeft, Eye, EyeOff, Loader2 } from "lucide-react";
import { useTheme } from "../contexts/ThemeContext";
import { useAuth } from "../contexts/AuthContext";

// Ícone do Google
const GoogleIcon = () => (
  <svg viewBox="0 0 24 24" width="20" height="20">
    <path
      fill="#4285F4"
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
    />
    <path
      fill="#34A853"
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
    />
    <path
      fill="#FBBC05"
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
    />
    <path
      fill="#EA4335"
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
    />
  </svg>
);

type LoginScreenProps = {
  onLoginSuccess: () => void;
  onBackToOnboarding: () => void;
  onSignup: () => void;
};

export default function LoginScreen({ onLoginSuccess, onBackToOnboarding, onSignup }: LoginScreenProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const { theme } = useTheme();
  const { login, loginWithGoogle, isLoading, error, clearError } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (email && password) {
      const success = await login(email, password);
      if (success) {
        onLoginSuccess();
      }
    }
  };

  const handleGoogleLogin = async () => {
    setIsGoogleLoading(true);
    try {
      const success = await loginWithGoogle();
      if (success) {
        onLoginSuccess();
      }
    } finally {
      setIsGoogleLoading(false);
    }
  };

  return (
    <div className={`min-h-screen ${theme === "dark" ? "bg-black" : "bg-white"} flex flex-col`}>
      <div className="mx-auto w-full max-w-[430px] min-h-screen flex flex-col">
        {/* Header */}
        <div className="pt-6 px-6">
          <button
            onClick={onBackToOnboarding}
            className={`p-2 rounded-full ${
              theme === "dark" ? "hover:bg-zinc-900" : "hover:bg-zinc-100"
            } transition-colors`}
          >
            <ArrowLeft className={`w-6 h-6 ${theme === "dark" ? "text-white" : "text-black"}`} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 flex flex-col justify-center px-6 py-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            {/* Title */}
            <div className="mb-10">
              <h1 className={`text-4xl mb-3 ${theme === "dark" ? "text-white" : "text-black"}`}>
                Que bom te ver de novo
              </h1>
              <p className={`text-lg ${theme === "dark" ? "text-zinc-400" : "text-zinc-600"}`}>
                Entre para continuar sua jornada
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Email Input */}
              <div>
                <label
                  htmlFor="email"
                  className={`block text-sm mb-2 ${theme === "dark" ? "text-zinc-400" : "text-zinc-600"}`}
                >
                  E-mail
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu@email.com"
                  className={`w-full px-4 py-4 rounded-2xl text-lg ${
                    theme === "dark"
                      ? "bg-zinc-900 text-white border-zinc-800 focus:border-emerald-500"
                      : "bg-zinc-50 text-black border-zinc-200 focus:border-emerald-500"
                  } border-2 focus:outline-none transition-colors`}
                  required
                />
              </div>

              {/* Password Input */}
              <div>
                <label
                  htmlFor="password"
                  className={`block text-sm mb-2 ${theme === "dark" ? "text-zinc-400" : "text-zinc-600"}`}
                >
                  Senha
                </label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Digite sua senha"
                    className={`w-full px-4 py-4 rounded-2xl text-lg ${
                      theme === "dark"
                        ? "bg-zinc-900 text-white border-zinc-800 focus:border-emerald-500"
                        : "bg-zinc-50 text-black border-zinc-200 focus:border-emerald-500"
                    } border-2 focus:outline-none transition-colors pr-12`}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className={`absolute right-4 top-1/2 -translate-y-1/2 ${
                      theme === "dark" ? "text-zinc-500" : "text-zinc-400"
                    }`}
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {/* Forgot Password */}
              <div className="text-right">
                <button
                  type="button"
                  className="text-emerald-500 hover:text-emerald-600 transition-colors text-sm"
                >
                  Esqueci minha senha
                </button>
              </div>

              {/* Error Message */}
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-4 rounded-xl bg-red-500/10 border border-red-500/20"
                >
                  <p className="text-red-500 text-sm text-center">{error}</p>
                </motion.div>
              )}

              {/* Submit Button */}
              <motion.button
                type="submit"
                disabled={isLoading}
                whileHover={{ scale: isLoading ? 1 : 1.02 }}
                whileTap={{ scale: isLoading ? 1 : 0.98 }}
                className={`w-full bg-emerald-600 text-white py-4 rounded-2xl text-lg mt-8 hover:bg-emerald-700 transition-colors shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-2 ${
                  isLoading ? "opacity-70 cursor-not-allowed" : ""
                }`}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Entrando...
                  </>
                ) : (
                  "Entrar"
                )}
              </motion.button>

              {/* Divider */}
              <div className="flex items-center gap-4 my-6">
                <div className={`flex-1 h-px ${theme === "dark" ? "bg-zinc-800" : "bg-zinc-200"}`} />
                <span className={`text-sm ${theme === "dark" ? "text-zinc-500" : "text-zinc-400"}`}>
                  ou continue com
                </span>
                <div className={`flex-1 h-px ${theme === "dark" ? "bg-zinc-800" : "bg-zinc-200"}`} />
              </div>

              {/* Google Login Button */}
              <motion.button
                type="button"
                onClick={handleGoogleLogin}
                disabled={isGoogleLoading}
                whileHover={{ scale: isGoogleLoading ? 1 : 1.02 }}
                whileTap={{ scale: isGoogleLoading ? 1 : 0.98 }}
                className={`w-full py-4 rounded-2xl text-lg flex items-center justify-center gap-3 transition-colors ${
                  theme === "dark"
                    ? "bg-zinc-900 text-white border-zinc-800 hover:bg-zinc-800"
                    : "bg-white text-black border-zinc-200 hover:bg-zinc-50"
                } border-2 ${isGoogleLoading ? "opacity-70 cursor-not-allowed" : ""}`}
              >
                {isGoogleLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Conectando...
                  </>
                ) : (
                  <>
                    <GoogleIcon />
                    Continuar com Google
                  </>
                )}
              </motion.button>
            </form>

            {/* Signup Link */}
            <div className="text-center mt-8">
              <button
                onClick={onSignup}
                className={`${theme === "dark" ? "text-zinc-400" : "text-zinc-600"} hover:text-emerald-500 transition-colors`}
              >
                Não tenho conta
              </button>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
