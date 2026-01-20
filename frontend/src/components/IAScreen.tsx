import { useState, useEffect, useRef } from "react";
import { Sparkles, Send, TrendingUp, PieChart, Loader2, RefreshCw, CheckCircle2, AlertTriangle } from "lucide-react";
import { useTheme } from "../contexts/ThemeContext";
import { aiService, FinancialKPIs, ChatMessage, AIInitialInsights } from "../services/ai.service";

type Message = {
  id: string;
  tipo: "user" | "ai";
  texto: string;
};

const MAX_CHAT_HISTORY = 5;

// Função para renderizar markdown básico (negrito e itálico)
const renderMarkdown = (text: string): React.ReactNode => {
  // Divide o texto em partes, processando negrito (**texto**) e itálico (*texto*)
  const parts: React.ReactNode[] = [];
  let remaining = text;
  let key = 0;

  while (remaining.length > 0) {
    // Procurar por **negrito**
    const boldMatch = remaining.match(/\*\*(.+?)\*\*/);
    // Procurar por *itálico*
    const italicMatch = remaining.match(/\*([^*]+?)\*/);

    if (boldMatch && boldMatch.index !== undefined && 
        (!italicMatch || italicMatch.index === undefined || boldMatch.index <= italicMatch.index)) {
      // Adicionar texto antes do match
      if (boldMatch.index > 0) {
        parts.push(remaining.substring(0, boldMatch.index));
      }
      // Adicionar texto em negrito
      parts.push(<strong key={key++}>{boldMatch[1]}</strong>);
      remaining = remaining.substring(boldMatch.index + boldMatch[0].length);
    } else if (italicMatch && italicMatch.index !== undefined) {
      // Adicionar texto antes do match
      if (italicMatch.index > 0) {
        parts.push(remaining.substring(0, italicMatch.index));
      }
      // Adicionar texto em itálico
      parts.push(<em key={key++}>{italicMatch[1]}</em>);
      remaining = remaining.substring(italicMatch.index + italicMatch[0].length);
    } else {
      // Sem mais matches, adicionar o resto do texto
      parts.push(remaining);
      break;
    }
  }

  return parts.length > 0 ? parts : text;
};

export default function IAScreen() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      tipo: "ai",
      texto: "Olá! Sou sua assistente de finanças. Como posso te ajudar?",
    },
  ]);
  const [inputValue, setInputValue] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [kpis, setKpis] = useState<FinancialKPIs | null>(null);
  const [insights, setInsights] = useState<AIInitialInsights | null>(null);
  const [conversationHistory, setConversationHistory] = useState<ChatMessage[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const isInitialLoad = useRef(true);
  const { theme } = useTheme();

  // Carregar KPIs e Insights ao iniciar
  useEffect(() => {
    // Scroll para o topo da página ao carregar
    window.scrollTo(0, 0);
    loadData();
  }, []);

  // Scroll para última mensagem (apenas quando o usuário envia mensagem)
  useEffect(() => {
    if (isInitialLoad.current) {
      return;
    }
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Marcar que o carregamento inicial terminou após os dados serem carregados
  useEffect(() => {
    if (!loading && isInitialLoad.current) {
      // Pequeno delay para garantir que o scroll para o topo seja aplicado
      setTimeout(() => {
        window.scrollTo(0, 0);
        isInitialLoad.current = false;
      }, 100);
    }
  }, [loading]);

  const loadData = async (forceRefresh = false) => {
    setLoading(true);
    try {
      // Se forçar refresh, limpar o cache
      if (forceRefresh) {
        aiService.clearInsightsCache();
      }

      // 1. Coletar KPIs
      const collectedKpis = await aiService.collectKPIs();
      setKpis(collectedKpis);
      
      // 2. Gerar insights (usa cache de 48h ou gera novos)
      const generatedInsights = await aiService.generateInitialInsights(collectedKpis);
      setInsights(generatedInsights);
      
      // 3. Mensagem inicial simples
      setMessages([
        {
          id: "1",
          tipo: "ai",
          texto: "Olá! Sou sua assistente de finanças. Analisei seus dados e preparei alguns insights acima. Como posso te ajudar?",
        },
      ]);
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
      setMessages([
        {
          id: "1",
          tipo: "ai",
          texto: "Olá! Sou sua assistente de finanças. Tive dificuldade em carregar seus dados, mas ainda posso responder suas perguntas!",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  // Função para forçar atualização dos insights
  const handleRefreshInsights = () => {
    loadData(true);
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim() || sending) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      tipo: "user",
      texto: inputValue,
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue("");
    setSending(true);

    try {
      // Atualizar histórico de conversação (máximo 5 mensagens)
      const userChatMessage: ChatMessage = { role: 'user' as const, content: inputValue };
      const newHistory: ChatMessage[] = [
        ...conversationHistory,
        userChatMessage
      ].slice(-MAX_CHAT_HISTORY);

      // Enviar para a IA com KPIs
      const response = await aiService.chat(
        inputValue, 
        kpis || await aiService.collectKPIs(),
        newHistory
      );

      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        tipo: "ai",
        texto: response.response,
      };

      setMessages(prev => [...prev, aiResponse]);
      
      // Atualizar histórico (máximo 5 mensagens)
      const assistantChatMessage: ChatMessage = { role: 'assistant' as const, content: response.response };
      setConversationHistory([
        ...newHistory,
        assistantChatMessage
      ].slice(-MAX_CHAT_HISTORY));

    } catch (error) {
      console.error("Erro ao enviar mensagem:", error);
      
      // Fallback para resposta local se o backend falhar
      const fallbackResponse: Message = {
        id: (Date.now() + 1).toString(),
        tipo: "ai",
        texto: getFallbackResponse(inputValue, kpis),
      };
      
      setMessages(prev => [...prev, fallbackResponse]);
    } finally {
      setSending(false);
    }
  };

  const getFallbackResponse = (input: string, data: FinancialKPIs | null): string => {
    const lowerInput = input.toLowerCase();
    
    if (!data) {
      return "Desculpe, não consegui acessar seus dados no momento. Tente novamente mais tarde.";
    }
    
    if (lowerInput.includes("gast") || lowerInput.includes("despesa")) {
      const topCategories = data.topExpenseCategories.slice(0, 3)
        .map(c => `${c.name}: R$ ${c.amount.toFixed(2)} (${c.percentage.toFixed(1)}%)`)
        .join(", ");
      return `Nos últimos 30 dias, você teve R$ ${data.totalExpenses.toFixed(2)} em despesas. Principais categorias: ${topCategories || "Nenhuma categoria registrada"}.`;
    }
    
    if (lowerInput.includes("invest") || lowerInput.includes("carteira")) {
      if (data.portfolioValue === 0) {
        return "Você ainda não possui investimentos registrados na sua carteira.";
      }
      const distribution = data.portfolioDistribution
        .map(d => `${d.tipo}: ${d.percentage.toFixed(1)}%`)
        .join(", ");
      return `Sua carteira vale R$ ${data.portfolioValue.toFixed(2)}, com resultado de ${data.portfolioProfitLoss >= 0 ? '+' : ''}R$ ${data.portfolioProfitLoss.toFixed(2)} (${data.portfolioProfitLossPercentage.toFixed(2)}%). Distribuição: ${distribution || "Não disponível"}.`;
    }
    
    if (lowerInput.includes("econom") || lowerInput.includes("poupar") || lowerInput.includes("dica")) {
      if (data.topExpenseCategories.length > 0) {
        const topCategory = data.topExpenseCategories[0];
        return `Sua maior categoria de gastos é "${topCategory.name}" com R$ ${topCategory.amount.toFixed(2)} (${topCategory.percentage.toFixed(1)}% do total). Considere revisar esses gastos para encontrar oportunidades de economia.`;
      }
      return "Registre mais transações para que eu possa analisar seus padrões de gastos e sugerir economias.";
    }
    
    if (lowerInput.includes("saldo") || lowerInput.includes("balanço")) {
      return `Seu balanço dos últimos 30 dias: Receitas R$ ${data.totalIncome.toFixed(2)} - Despesas R$ ${data.totalExpenses.toFixed(2)} = Saldo de R$ ${data.balance.toFixed(2)}.`;
    }
    
    return `Baseado nos seus dados: você teve ${data.transactionCount} transações nos últimos 30 dias, com saldo de R$ ${data.balance.toFixed(2)}. ${data.portfolioValue > 0 ? `Sua carteira de investimentos vale R$ ${data.portfolioValue.toFixed(2)}.` : ''} Como posso ajudar mais especificamente?`;
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  // Calcular score de saúde financeira baseado nas KPIs
  const calculateHealthScore = (data: FinancialKPIs | null): { score: number; status: string } => {
    if (!data) return { score: 0, status: "Carregando" };
    
    let score = 50; // Base
    
    // Saldo positivo aumenta o score
    if (data.balance > 0) {
      score += Math.min(20, (data.balance / data.totalIncome) * 40);
    } else if (data.balance < 0) {
      score -= Math.min(30, Math.abs(data.balance / data.totalExpenses) * 40);
    }
    
    // Ter investimentos aumenta o score
    if (data.portfolioValue > 0) {
      score += 15;
      // Lucro nos investimentos
      if (data.portfolioProfitLoss > 0) {
        score += 10;
      }
    }
    
    // Diversificação de despesas (não gastar muito em uma categoria só)
    if (data.topExpenseCategories.length > 0 && data.topExpenseCategories[0].percentage < 50) {
      score += 5;
    }
    
    score = Math.max(0, Math.min(100, Math.round(score)));
    
    let status = "Ruim";
    if (score >= 80) status = "Excelente";
    else if (score >= 60) status = "Boa";
    else if (score >= 40) status = "Regular";
    
    return { score, status };
  };

  const healthScore = calculateHealthScore(kpis);

  if (loading) {
    return (
      <div className={`min-h-screen ${theme === "dark" ? "bg-black text-white" : "bg-white text-black"} flex items-center justify-center`}>
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-purple-600 mx-auto mb-4" />
          <p className={theme === "dark" ? "text-zinc-400" : "text-zinc-600"}>Analisando seus dados financeiros...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${theme === "dark" ? "bg-black text-white" : "bg-white text-black"} flex flex-col`}>
      {/* Header */}
      <div className="px-4 pt-6 pb-4">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-600 rounded-full">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl">Inteligência Financeira</h1>
              <p className={`${theme === "dark" ? "text-zinc-400" : "text-zinc-600"} text-sm`}>Insights personalizados para você</p>
            </div>
          </div>          
        </div>

        {/* Saúde Financeira Score */}
        <div className="bg-gradient-to-br from-purple-600 to-purple-800 rounded-2xl p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-purple-100 text-sm mb-1">Score de Saúde Financeira</p>
              <div className="flex items-center gap-2">
                <h2 className="text-4xl text-white">{healthScore.score}</h2>
                <span className="text-purple-200">/100</span>
              </div>
            </div>
            <div className="text-center">
              <CheckCircle2 className="w-12 h-12 text-purple-200 mb-1" />
              <p className="text-purple-100 text-sm">{healthScore.status}</p>
            </div>
          </div>
          <div className="w-full bg-purple-900/50 rounded-full h-2">
            <div
              className="bg-purple-200 h-2 rounded-full transition-all"
              style={{ width: `${healthScore.score}%` }}
            />
          </div>
        </div>

        {/* Seções de Insights da IA */}
        {insights && (
          <>
            {/* Alertas e Oportunidades */}
            {insights.alertas.length > 0 && (
              <div className="mb-6">
                <h3 className="mb-3 flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-yellow-500" />
                  Alertas e Oportunidades
                </h3>
                <div className="space-y-3">
                  {insights.alertas.map((alerta) => (
                    <div
                      key={alerta.id}
                      className={`${theme === "dark" ? "bg-zinc-900" : "bg-zinc-50"} rounded-xl p-4 border-l-4 ${
                        alerta.tipo === "alerta" ? "border-yellow-500" : "border-emerald-500"
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`p-2 rounded-full ${
                          alerta.tipo === "alerta" ? "bg-yellow-500/10" : "bg-emerald-500/10"
                        }`}>
                          {alerta.tipo === "alerta" ? (
                            <AlertTriangle className={`w-4 h-4 ${alerta.tipo === "alerta" ? "text-yellow-500" : "text-emerald-500"}`} />
                          ) : (
                            <TrendingUp className="w-4 h-4 text-emerald-500" />
                          )}
                        </div>
                        <div className="flex-1">
                          <p className={`text-sm font-medium ${theme === "dark" ? "text-zinc-200" : "text-zinc-800"}`}>
                            {alerta.titulo}
                          </p>
                          <p className={`text-xs mt-1 ${theme === "dark" ? "text-zinc-400" : "text-zinc-600"}`}>
                            {alerta.descricao}
                          </p>
                          {alerta.valor && (
                            <p className={`text-xs mt-2 font-medium ${
                              alerta.tipo === "alerta" ? "text-yellow-500" : "text-emerald-500"
                            }`}>
                              {alerta.valor}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Análise de Risco */}
            {insights.analiseRisco.length > 0 && (
              <div className="mb-6">
                <h3 className="mb-3 flex items-center gap-2">
                  <PieChart className="w-5 h-5 text-blue-500" />
                  Análise de Risco
                </h3>
                <div className="space-y-3">
                  {insights.analiseRisco.map((risco) => (
                    <div
                      key={risco.id}
                      className={`${theme === "dark" ? "bg-zinc-900" : "bg-zinc-50"} rounded-xl p-4`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <p className={`text-sm font-medium ${theme === "dark" ? "text-zinc-200" : "text-zinc-800"}`}>
                          {risco.titulo}
                        </p>
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          risco.nivel === "alto" ? "bg-red-500/20 text-red-400" :
                          risco.nivel === "medio" ? "bg-yellow-500/20 text-yellow-400" :
                          "bg-green-500/20 text-green-400"
                        }`}>
                          {risco.nivel === "alto" ? "Alto" : risco.nivel === "medio" ? "Médio" : "Baixo"}
                        </span>
                      </div>
                      <p className={`text-xs ${theme === "dark" ? "text-zinc-400" : "text-zinc-600"}`}>
                        {risco.descricao}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Sugestões Personalizadas */}
            {insights.sugestoes.length > 0 && (
              <div className="mb-6">
                <h3 className="mb-3 flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-purple-500" />
                  Sugestões Personalizadas
                </h3>
                <div className="space-y-3">
                  {insights.sugestoes.map((sugestao) => (
                    <div
                      key={sugestao.id}
                      className={`${theme === "dark" ? "bg-zinc-900" : "bg-zinc-50"} rounded-xl p-4 border-l-4 border-purple-500`}
                    >
                      <p className={`text-sm font-medium ${theme === "dark" ? "text-zinc-200" : "text-zinc-800"}`}>
                        {sugestao.titulo}
                      </p>
                      <p className={`text-xs mt-1 ${theme === "dark" ? "text-zinc-400" : "text-zinc-600"}`}>
                        {sugestao.descricao}
                      </p>
                      {sugestao.valor && (
                        <p className="text-xs mt-2 font-medium text-purple-500">
                          {sugestao.valor}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}        
      </div>

      {/* Chat Section */}
      <div className="flex-1 px-4 pb-4 flex flex-col">
        <h3 className="mb-3 flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-purple-500" />
          Chat com IA
        </h3>
        
        {/* Messages */}
        <div className={`flex-1 ${theme === "dark" ? "bg-zinc-900" : "bg-zinc-50"} rounded-xl p-4 mb-4 overflow-y-auto max-h-[300px] space-y-3`}>
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.tipo === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                  message.tipo === "user"
                    ? "bg-emerald-600 text-white"
                    : theme === "dark"
                      ? "bg-zinc-800 text-zinc-100"
                      : "bg-zinc-200 text-zinc-900"
                }`}
              >
                <p className="text-sm whitespace-pre-line">{renderMarkdown(message.texto)}</p>
              </div>
            </div>
          ))}
          {sending && (
            <div className="flex justify-start">
              <div className={`rounded-2xl px-4 py-3 ${theme === "dark" ? "bg-zinc-800" : "bg-zinc-200"}`}>
                <Loader2 className="w-5 h-5 animate-spin text-purple-500" />
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Pergunte sobre suas finanças..."
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !sending && handleSendMessage()}
            disabled={sending}
            className={`flex-1 ${
              theme === "dark"
                ? "bg-zinc-900 text-white border-zinc-800 focus:border-purple-500"
                : "bg-zinc-50 text-black border-zinc-200 focus:border-purple-500"
            } px-4 py-3 rounded-xl border focus:outline-none transition-colors disabled:opacity-50`}
          />
          <button
            onClick={handleSendMessage}
            disabled={sending || !inputValue.trim()}
            className="p-3 bg-purple-600 rounded-xl hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {sending ? (
              <Loader2 className="w-5 h-5 text-white animate-spin" />
            ) : (
              <Send className="w-5 h-5 text-white" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}