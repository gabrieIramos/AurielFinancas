import { useState } from "react";
import { Sparkles, AlertTriangle, CheckCircle2, Send, TrendingUp, PieChart } from "lucide-react";

// Mock Data - Insights
const insightsData = {
  saudeFinanceira: {
    score: 78,
    status: "Boa",
    cor: "emerald",
  },
  alertas: [
    {
      id: "1",
      tipo: "aviso",
      titulo: "Gastos com Alimentação Acima da Média",
      descricao: "Você gastou 18% a mais com alimentação este mês comparado à média dos últimos 3 meses.",
      valor: 608.70,
    },
    {
      id: "2",
      tipo: "info",
      titulo: "Oportunidade de Economia",
      descricao: "Considerando suas assinaturas, você poderia economizar R$ 45,80/mês cancelando serviços pouco usados.",
      valor: 45.80,
    },
  ],
  analiseRisco: [
    {
      id: "1",
      tipo: "concentracao",
      titulo: "Concentração no Setor Financeiro",
      descricao: "43% da sua carteira está em ações do setor financeiro. Considere diversificar.",
      nivel: "médio",
    },
    {
      id: "2",
      tipo: "diversificacao",
      titulo: "Boa Diversificação entre Ativos",
      descricao: "Sua carteira está bem balanceada entre ações e FIIs.",
      nivel: "bom",
    },
  ],
  sugestoes: [
    "Considere aumentar sua reserva de emergência para 6 meses de despesas",
    "Seus investimentos em FIIs estão gerando bons dividendos. Considere aumentar a posição.",
    "Seu gasto com transporte aumentou 25% este mês. Analise se vale a pena usar mais transporte público.",
  ],
};

type Message = {
  id: string;
  tipo: "user" | "ai";
  texto: string;
};

export default function IAScreen() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      tipo: "ai",
      texto: "Olá! Sou sua assistente de finanças. Posso te ajudar a analisar seus gastos, investimentos e dar sugestões personalizadas. Como posso ajudar?",
    },
  ]);
  const [inputValue, setInputValue] = useState("");

  const handleSendMessage = () => {
    if (!inputValue.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      tipo: "user",
      texto: inputValue,
    };

    // Mock AI response
    const aiResponse: Message = {
      id: (Date.now() + 1).toString(),
      tipo: "ai",
      texto: getMockResponse(inputValue),
    };

    setMessages([...messages, userMessage, aiResponse]);
    setInputValue("");
  };

  const getMockResponse = (input: string) => {
    const lowerInput = input.toLowerCase();
    
    if (lowerInput.includes("gast") || lowerInput.includes("despesa")) {
      return "Analisando seus gastos dos últimos 30 dias: você gastou R$ 8.345,80. As principais categorias foram Alimentação (R$ 608,70), Transporte (R$ 278,50) e Saúde (R$ 167,40). Seus gastos estão 5% acima da média dos últimos 3 meses.";
    }
    
    if (lowerInput.includes("invest") || lowerInput.includes("carteira")) {
      return "Sua carteira atual tem um valor de R$ 165.000, com rentabilidade de +4.5% no mês. Você está bem diversificado entre ações (65%) e FIIs (45%). Sugiro aumentar sua posição em renda fixa para balancear o risco.";
    }
    
    if (lowerInput.includes("econom") || lowerInput.includes("poupar")) {
      return "Com base no seu padrão de gastos, você poderia economizar cerca de R$ 450/mês reduzindo gastos com delivery (R$ 280) e assinaturas pouco usadas (R$ 170). Isso representaria uma economia de R$ 5.400 por ano!";
    }
    
    if (lowerInput.includes("risco")) {
      return "Sua carteira tem um nível de risco médio. 43% está concentrada no setor financeiro, o que pode ser arriscado. Sugiro diversificar para outros setores como tecnologia, consumo e saúde.";
    }
    
    return "Entendi sua pergunta. Com base nos seus dados financeiros, posso dizer que você está no caminho certo! Continue mantendo suas finanças organizadas e considere as sugestões que preparei para você.";
  };

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      {/* Header */}
      <div className="px-4 pt-6 pb-4">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-purple-600 rounded-full">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl">Inteligência Financeira</h1>
            <p className="text-zinc-400 text-sm">Insights personalizados para você</p>
          </div>
        </div>

        {/* Saúde Financeira Score */}
        <div className="bg-gradient-to-br from-purple-600 to-purple-800 rounded-2xl p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-purple-100 text-sm mb-1">Score de Saúde Financeira</p>
              <div className="flex items-center gap-2">
                <h2 className="text-4xl">{insightsData.saudeFinanceira.score}</h2>
                <span className="text-purple-200">/100</span>
              </div>
            </div>
            <div className="text-center">
              <CheckCircle2 className="w-12 h-12 text-purple-200 mb-1" />
              <p className="text-purple-100 text-sm">{insightsData.saudeFinanceira.status}</p>
            </div>
          </div>
          <div className="w-full bg-purple-900/50 rounded-full h-2">
            <div
              className="bg-purple-200 h-2 rounded-full transition-all"
              style={{ width: `${insightsData.saudeFinanceira.score}%` }}
            />
          </div>
        </div>

        {/* Alertas */}
        <div className="mb-6">
          <h3 className="mb-3 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-yellow-500" />
            Alertas e Oportunidades
          </h3>
          <div className="space-y-3">
            {insightsData.alertas.map((alerta) => (
              <div key={alerta.id} className="bg-zinc-900 rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <div
                    className={`p-2 rounded-full mt-1 ${
                      alerta.tipo === "aviso"
                        ? "bg-yellow-900/30"
                        : "bg-blue-900/30"
                    }`}
                  >
                    {alerta.tipo === "aviso" ? (
                      <AlertTriangle className="w-4 h-4 text-yellow-500" />
                    ) : (
                      <TrendingUp className="w-4 h-4 text-blue-400" />
                    )}
                  </div>
                  <div className="flex-1">
                    <h4 className="mb-1">{alerta.titulo}</h4>
                    <p className="text-zinc-400 text-sm mb-2">{alerta.descricao}</p>
                    {alerta.valor && (
                      <p className="text-emerald-400 text-sm">
                        Economia potencial: R$ {alerta.valor.toFixed(2)}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Análise de Risco */}
        <div className="mb-6">
          <h3 className="mb-3 flex items-center gap-2">
            <PieChart className="w-5 h-5 text-blue-500" />
            Análise de Risco
          </h3>
          <div className="space-y-3">
            {insightsData.analiseRisco.map((analise) => (
              <div key={analise.id} className="bg-zinc-900 rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <div
                    className={`px-2 py-1 rounded text-xs ${
                      analise.nivel === "médio"
                        ? "bg-yellow-900/30 text-yellow-500"
                        : "bg-emerald-900/30 text-emerald-400"
                    }`}
                  >
                    {analise.nivel}
                  </div>
                  <div className="flex-1">
                    <h4 className="mb-1">{analise.titulo}</h4>
                    <p className="text-zinc-400 text-sm">{analise.descricao}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Sugestões */}
        <div className="mb-6">
          <h3 className="mb-3">Sugestões Personalizadas</h3>
          <div className="bg-zinc-900 rounded-xl p-4 space-y-3">
            {insightsData.sugestoes.map((sugestao, index) => (
              <div key={index} className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 mt-0.5 flex-shrink-0" />
                <p className="text-zinc-300 text-sm">{sugestao}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Chat Section */}
      <div className="flex-1 px-4 pb-4 flex flex-col">
        <h3 className="mb-3 flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-purple-500" />
          Chat com IA
        </h3>
        
        {/* Messages */}
        <div className="flex-1 bg-zinc-900 rounded-xl p-4 mb-4 overflow-y-auto max-h-[300px] space-y-3">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.tipo === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                  message.tipo === "user"
                    ? "bg-emerald-600 text-white"
                    : "bg-zinc-800 text-zinc-100"
                }`}
              >
                <p className="text-sm">{message.texto}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Input */}
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Pergunte sobre suas finanças..."
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
            className="flex-1 bg-zinc-900 text-white px-4 py-3 rounded-xl border border-zinc-800 focus:outline-none focus:border-purple-500 transition-colors"
          />
          <button
            onClick={handleSendMessage}
            className="p-3 bg-purple-600 rounded-xl hover:bg-purple-700 transition-colors"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
