import { useState } from "react";
import { User, Mail, Phone, Bell, Shield, HelpCircle, LogOut, ChevronRight, Upload, FileText, Moon, Sun, X, Download, Check } from "lucide-react";
import { useTheme } from "../contexts/ThemeContext";
import { useAuth } from "../contexts/AuthContext";
import { Switch } from "./ui/switch";
import { investmentsService, PortfolioItem, FixedIncomeInvestment } from "../services/investments.service";
import * as XLSX from "xlsx";
import PrivacySecurityModal from "./PrivacySecurityModal";
import Loading from "./Loading";

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
  const [showExportModal, setShowExportModal] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [exportSuccess, setExportSuccess] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);

  const userData = {
    nome: user?.name || "Rafael Silva",
    email: user?.email || "rafael.silva@email.com",
    telefone: "(11) 98765-4321",
    membro: "Premium",
    dataCadastro: "Janeiro 2024",
  };

  const handleMenuItemClick = (label: string) => {
    if (label === "Exportar Dados") {
      setShowExportModal(true);
      setExportSuccess(false);
      setExportError(null);
    } else if (label === "Privacidade e Segurança") {
      setShowPrivacyModal(true);
    }
  };

  const exportInvestmentsToExcel = async (type: 'variable' | 'fixed' | 'all') => {
    setIsExporting(true);
    setExportError(null);
    setExportSuccess(false);

    try {
      const workbook = XLSX.utils.book_new();
      const currentDate = new Date().toLocaleDateString('pt-BR').replace(/\//g, '-');

      // Exportar Renda Variável
      if (type === 'variable' || type === 'all') {
        const portfolioResponse = await investmentsService.getPortfolio();
        const transactionsResponse = await investmentsService.getAll();
        
        if (portfolioResponse.error) {
          throw new Error(portfolioResponse.error);
        }
        
        const portfolioItems = portfolioResponse.data?.items || [];
        const transactions = transactionsResponse.data || [];

        if (portfolioItems.length > 0) {
          // Aba 1: Carteira Consolidada
          const variableData = portfolioItems.map((item: PortfolioItem) => ({            
            'Ticker': item.ativo.ticker,
            'Tipo': item.ativo.tipo,
            'Categoria': item.ativo.categoria,
            'Quantidade': Number(item.totalQuantity || 0),
            'Preço Médio (R$)': Number(Number(item.averagePrice || 0).toFixed(2)),
            'Preço Atual (R$)': Number(Number(item.currentPrice || 0).toFixed(2)),
            'Custo Total (R$)': Number(Number(item.totalCost || 0).toFixed(2)),
            'Valor Atual (R$)': Number(Number(item.currentValue || 0).toFixed(2)),
            'Lucro/Prejuízo (R$)': Number(Number(item.profitLoss || 0).toFixed(2)),
            'Rentabilidade (%)': Number(Number(item.profitLossPercentage || 0).toFixed(2)),
          }));

          const wsVariable = XLSX.utils.json_to_sheet(variableData);
          
          // Ajustar largura das colunas
          wsVariable['!cols'] = [            
            { wch: 10 }, // Ticker
            { wch: 12 }, // Tipo
            { wch: 15 }, // Categoria
            { wch: 12 }, // Quantidade
            { wch: 18 }, // Preço Médio
            { wch: 18 }, // Preço Atual
            { wch: 18 }, // Custo Total
            { wch: 18 }, // Valor Atual
            { wch: 20 }, // Lucro/Prejuízo
            { wch: 18 }, // Rentabilidade
          ];

          XLSX.utils.book_append_sheet(workbook, wsVariable, 'Renda Variável');

          // Aba 2: Transações Detalhadas (com corretora)
          if (transactions.length > 0) {
            const transactionsData = transactions.map((t) => ({
              'Data': new Date(t.purchaseDate).toLocaleDateString('pt-BR'),
              'Tipo': Number(t.quantity) >= 0 ? 'Compra' : 'Venda',
              'Ticker': t.ativo?.ticker || '-',
              'Nome': t.ativo?.nome || '-',
              'Quantidade': Math.abs(Number(t.quantity)),
              'Preço (R$)': Number(Number(t.purchasePrice || 0).toFixed(2)),
              'Total (R$)': Number((Math.abs(Number(t.quantity)) * Number(t.purchasePrice || 0)).toFixed(2)),
              'Corretora': t.broker || '-',
            }));

            const wsTransactions = XLSX.utils.json_to_sheet(transactionsData);
            
            wsTransactions['!cols'] = [
              { wch: 12 }, // Data
              { wch: 10 }, // Tipo
              { wch: 10 }, // Ticker
              { wch: 25 }, // Nome
              { wch: 12 }, // Quantidade
              { wch: 15 }, // Preço
              { wch: 15 }, // Total
              { wch: 20 }, // Corretora
            ];

            XLSX.utils.book_append_sheet(workbook, wsTransactions, 'Transações RV');
          }
        }
      }

      // Exportar Renda Fixa
      if (type === 'fixed' || type === 'all') {
        const fixedIncomeResponse = await investmentsService.getFixedIncomePortfolio();
        
        if (fixedIncomeResponse.error) {
          throw new Error(fixedIncomeResponse.error);
        }
        
        const fixedIncomeItems = fixedIncomeResponse.data?.items || [];

        if (fixedIncomeItems.length > 0) {
          const fixedData = fixedIncomeItems.map((item: FixedIncomeInvestment) => ({
            'Nome': item.name,
            'Tipo': item.type,
            'Instituição': item.institution || '-',
            'Valor Investido (R$)': Number(Number(item.investedAmount).toFixed(2)),
            'Valor Atual (R$)': Number(Number(item.estimatedCurrentValue || item.investedAmount).toFixed(2)),
            'Taxa (%)': Number(Number(item.interestRate || 0).toFixed(2)),
            'Indexador': item.indexer,
            'Data de Compra': new Date(item.purchaseDate).toLocaleDateString('pt-BR'),
            'Vencimento': item.maturityDate ? new Date(item.maturityDate).toLocaleDateString('pt-BR') : '-',
            'Rendimento Total (R$)': Number(Number(item.totalYield || 0).toFixed(2)),
            'Rendimento (%)': Number(Number(item.yieldPercentage || 0).toFixed(2)),
            'Status': item.isActive ? 'Ativo' : 'Resgatado',
          }));

          const wsFixed = XLSX.utils.json_to_sheet(fixedData);
          
          // Ajustar largura das colunas
          wsFixed['!cols'] = [
            { wch: 25 }, // Nome
            { wch: 18 }, // Tipo
            { wch: 20 }, // Instituição
            { wch: 20 }, // Valor Investido
            { wch: 18 }, // Valor Atual
            { wch: 10 }, // Taxa
            { wch: 12 }, // Indexador
            { wch: 15 }, // Data de Compra
            { wch: 15 }, // Vencimento
            { wch: 22 }, // Rendimento Total
            { wch: 15 }, // Rendimento %
            { wch: 12 }, // Status
          ];

          XLSX.utils.book_append_sheet(workbook, wsFixed, 'Renda Fixa');
        }
      }

      // Verificar se há dados para exportar
      if (workbook.SheetNames.length === 0) {
        throw new Error('Nenhum investimento encontrado para exportar.');
      }

      // Gerar nome do arquivo
      const typeLabel = type === 'variable' ? 'RendaVariavel' : type === 'fixed' ? 'RendaFixa' : 'Investimentos';
      const fileName = `${typeLabel}_${currentDate}.xlsx`;

      // Download do arquivo
      XLSX.writeFile(workbook, fileName);
      
      setExportSuccess(true);
      setTimeout(() => {
        setShowExportModal(false);
        setExportSuccess(false);
      }, 2000);

    } catch (error) {
      console.error('Erro ao exportar:', error);
      setExportError(error instanceof Error ? error.message : 'Erro ao exportar dados');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className={`min-h-screen ${theme === "dark" ? "bg-black text-white" : "bg-white text-black"} pb-4`}>
      {/* Header */}
      <div className="px-4 pt-6 pb-4">
        <h1 className="text-2xl mb-6">Perfil</h1>

        {/* User Card */}
        <div className={`${theme === "dark" ? "bg-gradient-to-br from-zinc-800 to-zinc-900" : "bg-gradient-to-br from-zinc-100 to-zinc-200"} rounded-2xl p-6 mb-6`}>
          <div className="flex items-center gap-4 mb-4">
            {user?.image ? (
              <img 
                src={user.image} 
                alt={userData.nome}
                className="w-16 h-16 rounded-full object-cover flex-shrink-0"
                onError={(e) => {
                  // Se a imagem falhar, esconde e mostra as iniciais
                  e.currentTarget.style.display = 'none';
                  e.currentTarget.nextElementSibling?.classList.remove('hidden');
                }}
                referrerPolicy="no-referrer"
              />
            ) : null}
            <div className={`w-16 h-16 bg-emerald-600 rounded-full flex items-center justify-center flex-shrink-0 ${user?.image ? 'hidden' : ''}`}>
              <span className="text-2xl text-white">
                {userData.nome.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-xl mb-1 truncate">{userData.nome}</h2>
              <div className="flex items-center gap-2 flex-wrap">
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
                      onClick={() => handleMenuItemClick(item.label)}
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
          <p className={`${theme === "dark" ? "text-zinc-600" : "text-zinc-500"} text-xs mt-1`}>© {new Date().getFullYear()} Auriel Financas. Todos os direitos reservados.</p>
        </div>
      </div>

      {/* Export Modal */}
      {showExportModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className={`${theme === "dark" ? "bg-zinc-900" : "bg-white"} rounded-2xl w-full max-w-md p-6 shadow-xl`}>
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-emerald-600/20 rounded-full flex items-center justify-center">
                  <Download className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                  <h3 className={`text-lg font-semibold ${theme === "dark" ? "text-white" : "text-black"}`}>
                    Exportar Investimentos
                  </h3>
                  <p className={`text-sm ${theme === "dark" ? "text-zinc-400" : "text-zinc-600"}`}>
                    Escolha o que deseja exportar
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowExportModal(false)}
                className={`p-2 rounded-full ${theme === "dark" ? "hover:bg-zinc-800" : "hover:bg-zinc-100"}`}
                disabled={isExporting}
              >
                <X className={`w-5 h-5 ${theme === "dark" ? "text-zinc-400" : "text-zinc-600"}`} />
              </button>
            </div>

            {/* Success Message */}
            {exportSuccess && (
              <div className="mb-4 p-4 bg-emerald-600/20 rounded-xl flex items-center gap-3">
                <Check className="w-5 h-5 text-emerald-400" />
                <span className="text-emerald-400">Exportação realizada com sucesso!</span>
              </div>
            )}

            {/* Error Message */}
            {exportError && (
              <div className="mb-4 p-4 bg-red-600/20 rounded-xl">
                <span className="text-red-400">{exportError}</span>
              </div>
            )}

            {/* Export Options */}
            <div className="space-y-2">
              <button
                onClick={() => exportInvestmentsToExcel('variable')}
                disabled={isExporting}
className={`w-full p-3 rounded-xl flex items-center justify-between ${
                  theme === "dark" ? "bg-zinc-800 hover:bg-zinc-700" : "bg-zinc-50 hover:bg-zinc-100"
                } transition-colors disabled:opacity-50`}
              >
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-blue-600/20 rounded-lg flex items-center justify-center">
                    <FileText className="w-4 h-4 text-blue-400" />
                  </div>
                  <div className="text-center">
                    <p className={`text-sm ${theme === "dark" ? "text-white" : "text-black"}`}>Renda Variável</p>
                    <p className={`text-xs ${theme === "dark" ? "text-zinc-400" : "text-zinc-600"}`}>Ações, FIIs, ETFs, BDRs</p>
                  </div>
                </div>
                {isExporting ? (
                  <Loading size="sm" color="text" inline />
                ) : (
                  <Download className={`w-5 h-5 ${theme === "dark" ? "text-zinc-500" : "text-zinc-400"}`} />
                )}
              </button>

              <button
                onClick={() => exportInvestmentsToExcel('fixed')}
                disabled={isExporting}
                className={`w-full p-3 rounded-xl flex items-center justify-between ${
                  theme === "dark" ? "bg-zinc-800 hover:bg-zinc-700" : "bg-zinc-50 hover:bg-zinc-100"
                } transition-colors disabled:opacity-50`}
              >
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-purple-600/20 rounded-lg flex items-center justify-center">
                    <FileText className="w-4 h-4 text-purple-400" />
                  </div>
                  <div className="text-center">
                    <p className={`text-sm ${theme === "dark" ? "text-white" : "text-black"}`}>Renda Fixa</p>
                    <p className={`text-xs ${theme === "dark" ? "text-zinc-400" : "text-zinc-600"}`}>CDB, LCI, LCA, Tesouro Direto</p>
                  </div>
                </div>
                {isExporting ? (
                  <Loading size="sm" color="text" inline />
                ) : (
                  <Download className={`w-5 h-5 ${theme === "dark" ? "text-zinc-500" : "text-zinc-400"}`} />
                )}
              </button>

              <button
                onClick={() => exportInvestmentsToExcel('all')}
                disabled={isExporting}
                className={`w-full p-3 rounded-xl flex items-center justify-between bg-emerald-600 hover:bg-emerald-700 transition-colors disabled:opacity-50`}
              >
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                    <FileText className="w-4 h-4 text-white" />
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-white font-medium">Exportar Tudo</p>
                    <p className="text-xs text-emerald-100">Todos os investimentos em um arquivo</p>
                  </div>
                </div>
                {isExporting ? (
                  <Loading size="sm" color="white" inline />
                ) : (
                  <Download className="w-5 h-5 text-white" />
                )}
              </button>
            </div>

            {/* Footer */}
            <p className={`mt-4 text-xs text-center ${theme === "dark" ? "text-zinc-500" : "text-zinc-400"}`}>
              O arquivo será baixado em formato Excel (.xlsx)
            </p>
          </div>
        </div>
      )}

      {/* Privacy & Security Modal */}
      <PrivacySecurityModal
        isOpen={showPrivacyModal}
        onClose={() => setShowPrivacyModal(false)}
        theme={theme}
      />
    </div>
  );
}