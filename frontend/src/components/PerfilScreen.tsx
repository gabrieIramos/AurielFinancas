import { User, Mail, Phone, Bell, Shield, HelpCircle, LogOut, ChevronRight, Upload, FileText, Moon, Sun } from "lucide-react";
import { useTheme } from "../contexts/ThemeContext";
import { useAuth } from "../contexts/AuthContext";
import { Switch } from "./ui/switch";

// Mock user data will be replaced by auth context
const menuItems = [
  {
    categoria: "Conta",
    items: [
      { icon: User, label: "Informações Pessoais", badge: null },      
      { icon: FileText, label: "Exportar Dados", badge: 'Novo' },
    ],
  },
  {
    categoria: "Preferências",
    items: [
      { icon: Bell, label: "Notificações", badge: null },
      { icon: Shield, label: "Privacidade e Segurança", badge: null },
    ],
  },
  {
    categoria: "Suporte",
    items: [
      { icon: HelpCircle, label: "Central de Ajuda", badge: null },
    ],
  },
];

export default function PerfilScreen() {
  const { theme, toggleTheme } = useTheme();
  const { user, logout } = useAuth();

  const userData = {
    nome: user?.name || "Rafael Silva",
    email: user?.email || "rafael.silva@email.com",
    telefone: "(11) 98765-4321",
    membro: "Premium",
    dataCadastro: "Janeiro 2024",
  };

  return (
    <div className={`min-h-screen ${theme === "dark" ? "bg-black text-white" : "bg-white text-black"} pb-4`}>
      {/* Header */}
      <div className="px-4 pt-6 pb-4">
        <h1 className="text-2xl mb-6">Perfil</h1>

        {/* User Card */}
        <div className={`${theme === "dark" ? "bg-gradient-to-br from-zinc-800 to-zinc-900" : "bg-gradient-to-br from-zinc-100 to-zinc-200"} rounded-2xl p-6 mb-6`}>
          <div className="flex items-center gap-4 mb-4">
            <div className="w-16 h-16 bg-emerald-600 rounded-full flex items-center justify-center">
              <span className="text-2xl text-white">{userData.nome.split(' ').map(n => n[0]).join('').substring(0, 2)}</span>
            </div>
            <div className="flex-1">
              <h2 className="text-xl mb-1">{userData.nome}</h2>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 bg-emerald-600 text-xs rounded-full text-white">
                  {userData.membro}
                </span>
                <span className={`${theme === "dark" ? "text-zinc-400" : "text-zinc-600"} text-sm`}>
                  Membro desde {userData.dataCadastro}
                </span>
              </div>
            </div>
          </div>

          <div className={`space-y-3 pt-4 border-t ${theme === "dark" ? "border-zinc-700" : "border-zinc-300"}`}>
            <div className="flex items-center gap-3">
              <Mail className={`w-4 h-4 ${theme === "dark" ? "text-zinc-400" : "text-zinc-600"}`} />
              <span className={`text-sm ${theme === "dark" ? "text-zinc-300" : "text-zinc-700"}`}>{userData.email}</span>
            </div>
            <div className="flex items-center gap-3">
              <Phone className={`w-4 h-4 ${theme === "dark" ? "text-zinc-400" : "text-zinc-600"}`} />
              <span className={`text-sm ${theme === "dark" ? "text-zinc-300" : "text-zinc-700"}`}>{userData.telefone}</span>
            </div>
          </div>
        </div>

        {/* Theme Toggle */}
        <div className={`${theme === "dark" ? "bg-zinc-900" : "bg-zinc-50"} rounded-xl p-4 mb-6`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {theme === "dark" ? (
                <Moon className="w-5 h-5 text-blue-400" />
              ) : (
                <Sun className="w-5 h-5 text-yellow-500" />
              )}
              <div>
                <p className={theme === "dark" ? "text-white" : "text-black"}>Modo Escuro</p>
                <p className={`text-xs ${theme === "dark" ? "text-zinc-400" : "text-zinc-600"}`}>
                  {theme === "dark" ? "Ativado" : "Desativado"}
                </p>
              </div>
            </div>
            <Switch
              checked={theme === "dark"}
              onCheckedChange={toggleTheme}
            />
          </div>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className={`${theme === "dark" ? "bg-zinc-900" : "bg-zinc-50"} rounded-xl p-4 text-center`}>
            <p className="text-2xl text-emerald-400 mb-1">247</p>
            <p className={`text-xs ${theme === "dark" ? "text-zinc-400" : "text-zinc-600"}`}>Transações</p>
          </div>
          <div className={`${theme === "dark" ? "bg-zinc-900" : "bg-zinc-50"} rounded-xl p-4 text-center`}>
            <p className="text-2xl text-blue-400 mb-1">12</p>
            <p className={`text-xs ${theme === "dark" ? "text-zinc-400" : "text-zinc-600"}`}>Ativos</p>
          </div>
          <div className={`${theme === "dark" ? "bg-zinc-900" : "bg-zinc-50"} rounded-xl p-4 text-center`}>
            <p className="text-2xl text-purple-400 mb-1">6</p>
            <p className={`text-xs ${theme === "dark" ? "text-zinc-400" : "text-zinc-600"}`}>Meses</p>
          </div>
        </div>

        {/* Menu Items */}
        <div className="space-y-6">
          {menuItems.map((section, sectionIndex) => (
            <div key={sectionIndex}>
              <h3 className={`text-sm ${theme === "dark" ? "text-zinc-500" : "text-zinc-600"} mb-3 px-2`}>{section.categoria}</h3>
              <div className={`${theme === "dark" ? "bg-zinc-900" : "bg-zinc-50"} rounded-xl overflow-hidden`}>
                {section.items.map((item, itemIndex) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={itemIndex}
                      className={`w-full flex items-center justify-between p-4 ${
                        theme === "dark" ? "hover:bg-zinc-800" : "hover:bg-zinc-100"
                      } transition-colors ${
                        itemIndex !== section.items.length - 1 
                          ? theme === "dark" ? "border-b border-zinc-800" : "border-b border-zinc-200"
                          : ""
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Icon className={`w-5 h-5 ${theme === "dark" ? "text-zinc-400" : "text-zinc-600"}`} />
                        <span className={theme === "dark" ? "text-white" : "text-black"}>{item.label}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {item.badge && (
                          <span className="px-2 py-0.5 bg-emerald-600 text-xs rounded-full text-white">
                            {item.badge}
                          </span>
                        )}
                        <ChevronRight className={`w-5 h-5 ${theme === "dark" ? "text-zinc-500" : "text-zinc-400"}`} />
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>        

        {/* Logout Button */}
        <button
          onClick={logout}
          className={`w-full mt-6 ${
            theme === "dark" ? "bg-red-900/30" : "bg-red-50"
          } text-red-400 p-4 rounded-xl flex items-center justify-center gap-2 ${
            theme === "dark" ? "hover:bg-red-900/50" : "hover:bg-red-100"
          } transition-colors`}
        >
          <LogOut className="w-5 h-5" />
          <span>Sair da Conta</span>
        </button>

        {/* Version Info */}
        <div className="mt-6 text-center">
          <p className={`${theme === "dark" ? "text-zinc-500" : "text-zinc-400"} text-xs`}>Versão 1.0.0</p>
          <p className={`${theme === "dark" ? "text-zinc-600" : "text-zinc-500"} text-xs mt-1`}>© 2024 Auriel Financas. Todos os direitos reservados.</p>
        </div>
      </div>
    </div>
  );
}