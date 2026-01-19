import { useState } from "react";
import { motion } from "motion/react";
import { ArrowLeft, Eye, EyeOff, Loader2 } from "lucide-react";
import { useTheme } from "../contexts/ThemeContext";
import { useAuth } from "../contexts/AuthContext";

type LoginScreenProps = {
  onLoginSuccess: () => void;
  onBackToOnboarding: () => void;
  onSignup: () => void;
};

export default function LoginScreen({ onLoginSuccess, onBackToOnboarding, onSignup }: LoginScreenProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const { theme } = useTheme();
  const { login, isLoading, error, clearError } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (email && password) {
      const success = await login(email, password);
      if (success) {
        onLoginSuccess();
      }
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
