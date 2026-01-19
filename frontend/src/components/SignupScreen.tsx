import { useState } from "react";
import { motion } from "motion/react";
import { ArrowLeft, Eye, EyeOff, Loader2 } from "lucide-react";
import { useTheme } from "../contexts/ThemeContext";
import { useAuth } from "../contexts/AuthContext";

type SignupScreenProps = {
  onSignupSuccess: () => void;
  onBackToLogin: () => void;
};

export default function SignupScreen({ onSignupSuccess, onBackToLogin }: SignupScreenProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const { theme } = useTheme();
  const { signup, isLoading, error } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (name && email && password) {
      const success = await signup(name, email, password);
      if (success) {
        onSignupSuccess();
      }
    }
  };

  return (
    <div className={`min-h-screen ${theme === "dark" ? "bg-black" : "bg-white"} flex flex-col`}>
      <div className="mx-auto w-full max-w-[430px] min-h-screen flex flex-col">
        {/* Header */}
        <div className="pt-6 px-6">
          <button
            onClick={onBackToLogin}
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
                Crie sua conta e dê o primeiro passo
              </h1>
              <p className={`text-lg ${theme === "dark" ? "text-zinc-400" : "text-zinc-600"}`}>
                Comece sua jornada rumo à liberdade financeira
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Name Input */}
              <div>
                <label
                  htmlFor="name"
                  className={`block text-sm mb-2 ${theme === "dark" ? "text-zinc-400" : "text-zinc-600"}`}
                >
                  Nome completo
                </label>
                <input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Digite seu nome"
                  className={`w-full px-4 py-4 rounded-2xl text-lg ${
                    theme === "dark"
                      ? "bg-zinc-900 text-white border-zinc-800 focus:border-emerald-500"
                      : "bg-zinc-50 text-black border-zinc-200 focus:border-emerald-500"
                  } border-2 focus:outline-none transition-colors`}
                  required
                />
              </div>

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
                    placeholder="Mínimo 6 caracteres"
                    className={`w-full px-4 py-4 rounded-2xl text-lg ${
                      theme === "dark"
                        ? "bg-zinc-900 text-white border-zinc-800 focus:border-emerald-500"
                        : "bg-zinc-50 text-black border-zinc-200 focus:border-emerald-500"
                    } border-2 focus:outline-none transition-colors pr-12`}
                    required
                    minLength={6}
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
                    Criando conta...
                  </>
                ) : (
                  "Criar minha conta"
                )}
              </motion.button>
            </form>

            {/* Security Note */}
            <p
              className={`text-sm text-center mt-6 ${
                theme === "dark" ? "text-zinc-500" : "text-zinc-500"
              }`}
            >
              🔒 Seus dados ficam protegidos e nunca são compartilhados
            </p>

            {/* Login Link */}
            <div className="text-center mt-8">
              <button
                onClick={onBackToLogin}
                className={`${theme === "dark" ? "text-zinc-400" : "text-zinc-600"} hover:text-emerald-500 transition-colors`}
              >
                Já tenho uma conta
              </button>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
