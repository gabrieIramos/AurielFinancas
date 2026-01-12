import { User, Mail, Phone, Bell, Shield, HelpCircle, LogOut, ChevronRight, Upload, FileText } from "lucide-react";

// Mock user data
const userData = {
  nome: "Rafael Silva",
  email: "rafael.silva@email.com",
  telefone: "(11) 98765-4321",
  membro: "Premium",
  dataCadastro: "Janeiro 2024",
};

const menuItems = [
  {
    categoria: "Conta",
    items: [
      { icon: User, label: "Informações Pessoais", badge: null },
      { icon: Upload, label: "Importar OFX", badge: "Novo" },
      { icon: FileText, label: "Exportar Dados", badge: null },
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
  return (
    <div className="min-h-screen bg-black text-white pb-4">
      {/* Header */}
      <div className="px-4 pt-6 pb-4">
        <h1 className="text-2xl mb-6">Perfil</h1>

        {/* User Card */}
        <div className="bg-gradient-to-br from-zinc-800 to-zinc-900 rounded-2xl p-6 mb-6">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-16 h-16 bg-emerald-600 rounded-full flex items-center justify-center">
              <span className="text-2xl">RS</span>
            </div>
            <div className="flex-1">
              <h2 className="text-xl mb-1">{userData.nome}</h2>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 bg-emerald-600 text-xs rounded-full">
                  {userData.membro}
                </span>
                <span className="text-zinc-400 text-sm">
                  Membro desde {userData.dataCadastro}
                </span>
              </div>
            </div>
          </div>

          <div className="space-y-3 pt-4 border-t border-zinc-700">
            <div className="flex items-center gap-3">
              <Mail className="w-4 h-4 text-zinc-400" />
              <span className="text-sm text-zinc-300">{userData.email}</span>
            </div>
            <div className="flex items-center gap-3">
              <Phone className="w-4 h-4 text-zinc-400" />
              <span className="text-sm text-zinc-300">{userData.telefone}</span>
            </div>
          </div>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="bg-zinc-900 rounded-xl p-4 text-center">
            <p className="text-2xl text-emerald-400 mb-1">247</p>
            <p className="text-xs text-zinc-400">Transações</p>
          </div>
          <div className="bg-zinc-900 rounded-xl p-4 text-center">
            <p className="text-2xl text-blue-400 mb-1">12</p>
            <p className="text-xs text-zinc-400">Ativos</p>
          </div>
          <div className="bg-zinc-900 rounded-xl p-4 text-center">
            <p className="text-2xl text-purple-400 mb-1">6</p>
            <p className="text-xs text-zinc-400">Meses</p>
          </div>
        </div>

        {/* Menu Items */}
        <div className="space-y-6">
          {menuItems.map((section, sectionIndex) => (
            <div key={sectionIndex}>
              <h3 className="text-sm text-zinc-500 mb-3 px-2">{section.categoria}</h3>
              <div className="bg-zinc-900 rounded-xl overflow-hidden">
                {section.items.map((item, itemIndex) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={itemIndex}
                      className={`w-full flex items-center justify-between p-4 hover:bg-zinc-800 transition-colors ${
                        itemIndex !== section.items.length - 1 ? "border-b border-zinc-800" : ""
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Icon className="w-5 h-5 text-zinc-400" />
                        <span className="text-white">{item.label}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {item.badge && (
                          <span className="px-2 py-0.5 bg-emerald-600 text-xs rounded-full">
                            {item.badge}
                          </span>
                        )}
                        <ChevronRight className="w-5 h-5 text-zinc-500" />
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Import OFX Section */}
        <div className="mt-6 bg-gradient-to-br from-emerald-600 to-emerald-800 rounded-2xl p-6">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-white/20 rounded-full">
              <Upload className="w-6 h-6" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg mb-2">Importar Arquivos OFX</h3>
              <p className="text-emerald-100 text-sm mb-4">
                Faça upload de extratos bancários e faturas de cartão de crédito para sincronizar automaticamente suas transações.
              </p>
              <button className="px-4 py-2 bg-white text-emerald-700 rounded-lg hover:bg-emerald-50 transition-colors">
                Selecionar Arquivo
              </button>
            </div>
          </div>
        </div>

        {/* Logout Button */}
        <button className="w-full mt-6 bg-red-900/30 text-red-400 p-4 rounded-xl flex items-center justify-center gap-2 hover:bg-red-900/50 transition-colors">
          <LogOut className="w-5 h-5" />
          <span>Sair da Conta</span>
        </button>

        {/* Version Info */}
        <div className="mt-6 text-center">
          <p className="text-zinc-500 text-xs">Versão 1.0.0</p>
          <p className="text-zinc-600 text-xs mt-1">© 2024 FinanceApp. Todos os direitos reservados.</p>
        </div>
      </div>
    </div>
  );
}
