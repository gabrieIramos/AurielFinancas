import { useState, useEffect, useRef } from "react";
import { Send, CheckCheck } from "lucide-react";
import { useTheme } from "../contexts/ThemeContext";
import { aiService, FinancialKPIs, ChatMessage } from "../services/ai.service";
import Loading from "./Loading";

type Message = {
  id: string;
  tipo: "user" | "ai";
  texto: string;
  timestamp: Date;
  status: "sent" | "delivered" | "read";
};

const MAX_CHAT_HISTORY = 5;

const splitAIMessage = (fullText: string): string[] => {
  if (fullText.length < 200) {
    return [fullText];
  }

  const paragraphs = fullText.split(/\n\n+/).filter(p => p.trim().length > 0);

  if (paragraphs.length > 1) {
    return paragraphs.map(p => p.trim());
  }

  const sentences = fullText.split(/(?<=[.!?])\s+/).filter(s => s.trim().length > 0);

  if (sentences.length > 1) {
    const blocks: string[] = [];
    let currentBlock = "";

    for (const sentence of sentences) {
      if ((currentBlock + " " + sentence).length > 300 && currentBlock.length > 0) {
        blocks.push(currentBlock.trim());
        currentBlock = sentence;
      } else {
        currentBlock += (currentBlock ? " " : "") + sentence;
      }
    }

    if (currentBlock.length > 0) {
      blocks.push(currentBlock.trim());
    }

    return blocks.length > 1 ? blocks : [fullText];
  }

  return [fullText];
};

const renderMarkdown = (text: string): React.ReactNode => {
  const parts: React.ReactNode[] = [];
  let remaining = text;
  let key = 0;

  while (remaining.length > 0) {
    const boldMatch = remaining.match(/\*\*(.+?)\*\*/);
    const italicMatch = remaining.match(/\*([^*]+?)\*/);

    if (boldMatch && boldMatch.index !== undefined &&
      (!italicMatch || italicMatch.index === undefined || boldMatch.index <= italicMatch.index)) {
      if (boldMatch.index > 0) {
        parts.push(remaining.substring(0, boldMatch.index));
      }
      parts.push(<strong key={key++}>{boldMatch[1]}</strong>);
      remaining = remaining.substring(boldMatch.index + boldMatch[0].length);
    } else if (italicMatch && italicMatch.index !== undefined) {
      if (italicMatch.index > 0) {
        parts.push(remaining.substring(0, italicMatch.index));
      }
      parts.push(<em key={key++}>{italicMatch[1]}</em>);
      remaining = remaining.substring(italicMatch.index + italicMatch[0].length);
    } else {
      parts.push(remaining);
      break;
    }
  }

  return parts.length > 0 ? parts : text;
};

const formatTime = (date: Date) => {
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

export default function IAScreen() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      tipo: "ai",
      texto: "Oi! Sou a Sofia, sua consultora financeira pessoal 💰✨\n\nEstou aqui para ajudar você com análises de investimentos, sugestões de aportes, estratégias de economia e muito mais!\n\nO que você gostaria de discutir?",
      timestamp: new Date(),
      status: "read",
    },
  ]);
  const [inputValue, setInputValue] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [kpis, setKpis] = useState<FinancialKPIs | null>(null);
  const [conversationHistory, setConversationHistory] = useState<ChatMessage[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { theme } = useTheme();

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const loadData = async () => {
    try {
      const collectedKpis = await aiService.collectKPIs();
      setKpis(collectedKpis);
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim() || sending) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      tipo: "user",
      texto: inputValue,
      timestamp: new Date(),
      status: "sent",
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue("");
    setSending(true);

    setTimeout(() => {
      setMessages(prev => prev.map(msg =>
        msg.id === userMessage.id ? { ...msg, status: "delivered" } : msg
      ));
    }, 1000);

    setTimeout(() => {
      setMessages(prev => prev.map(msg =>
        msg.id === userMessage.id ? { ...msg, status: "read" } : msg
      ));
    }, 2000);

    try {
      const userChatMessage: ChatMessage = { role: 'user' as const, content: inputValue };
      const newHistory: ChatMessage[] = [
        ...conversationHistory,
        userChatMessage
      ].slice(-MAX_CHAT_HISTORY);

      const response = await aiService.chat(
        inputValue,
        kpis || await aiService.collectKPIs(),
        newHistory
      );

      const messageParts = splitAIMessage(response.response);

      let currentMessageId = Date.now();
      for (const part of messageParts) {
        const aiMessage: Message = {
          id: (currentMessageId++).toString(),
          tipo: "ai",
          texto: part,
          timestamp: new Date(),
          status: "read",
        };

        await new Promise(resolve => {
          setTimeout(() => {
            setMessages(prev => [...prev, aiMessage]);
            resolve(null);
          }, 500);
        });
      }

      const assistantChatMessage: ChatMessage = { role: 'assistant' as const, content: response.response };
      setConversationHistory([
        ...newHistory,
        assistantChatMessage
      ].slice(-MAX_CHAT_HISTORY));

    } catch (error) {
      console.error("Erro ao enviar mensagem:", error);

      const fallbackResponse: Message = {
        id: (Date.now() + 1).toString(),
        tipo: "ai",
        texto: getFallbackResponse(inputValue, kpis),
        timestamp: new Date(),
        status: "read",
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

  if (loading) {
    return (
      <div
        style={{
          minHeight: '100vh',
          width: '100%',
          backgroundColor: theme === "dark" ? '#09090b' : '#fafafa',
          color: theme === "dark" ? 'white' : 'black',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px'
        }}
      >
        <div className="text-center">
          <div className="mb-4" style={{ display: 'flex', justifyContent: 'center' }}>
            <Loading size="lg" color="emerald" />
          </div>
          <p style={{ color: theme === "dark" ? '#a1a1aa' : '#52525b' }}>Conectando com Sofia...</p>
        </div>
      </div>
    );
  }

  // Define Styles Object for cleaner JSX
  const styles = {
    container: {
      display: 'flex',
      flexDirection: 'column' as const,
      height: 'calc(100vh - 80px)', // Subtract navbar height
      width: '100%',
      backgroundColor: theme === "dark" ? '#09090b' : '#efeae2',
      overflow: 'hidden',
    },
    header: {
      backgroundColor: '#059669', // emerald-600
      padding: '16px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
      flexShrink: 0,
      zIndex: 10,
    },
    headerContent: {
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
    },
    avatar: {
      position: 'relative' as const,
    },
    avatarCircle: {
      width: '40px',
      height: '40px',
      borderRadius: '50%',
      backgroundColor: '#e4e4e7',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      border: '2px solid rgba(255,255,255,0.2)',
      overflow: 'hidden',
      fontSize: '20px',
    },
    onlineIndicator: {
      position: 'absolute' as const,
      bottom: 0,
      right: 0,
      width: '12px',
      height: '12px',
      backgroundColor: '#4ade80',
      borderRadius: '50%',
      border: '2px solid #059669',
    },
    headerTitle: {
      color: 'white',
      fontWeight: 600,
      fontSize: '18px',
      lineHeight: 1.25,
      margin: 0,
    },
    headerStatus: {
      color: 'rgba(255, 255, 255, 0.8)',
      fontSize: '13px',
      margin: 0,
    },
    messagesContainer: {
      flex: 1,
      overflowY: 'auto' as const,
      width: '100%',
      padding: '16px',
      display: 'flex',
      flexDirection: 'column' as const,
      gap: '8px',
    },
    messageRow: (isUser: boolean) => ({
      display: 'flex',
      justifyContent: isUser ? 'flex-end' : 'flex-start',
      width: '100%',
      marginBottom: '4px',
    }),
    bubble: (isUser: boolean) => ({
      maxWidth: '85%',
      padding: '10px 14px',
      borderRadius: isUser ? '16px 16px 0 16px' : '16px 16px 16px 0',
      backgroundColor: isUser
        ? '#059669' // emerald-600
        : (theme === "dark" ? '#27272a' : 'white'), // zinc-800 / white
      color: isUser
        ? 'white'
        : (theme === "dark" ? '#f4f4f5' : '#18181b'),
      boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
      position: 'relative' as const,
      fontSize: '15px',
      lineHeight: '1.4',
      wordWrap: 'break-word' as const,
    }),
    timestamp: (isUser: boolean) => ({
      fontSize: '11px',
      color: isUser
        ? 'rgba(255,255,255,0.7)'
        : (theme === "dark" ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.45)'),
      display: 'flex',
      justifyContent: 'flex-end',
      alignItems: 'center',
      gap: '4px',
      marginTop: '4px',
      lineHeight: 1,
    }),
    inputContainer: {
      backgroundColor: theme === "dark" ? '#18181b' : '#f0f2f5',
      padding: '12px',
      display: 'flex',
      alignItems: 'flex-end',
      gap: '8px',
      flexShrink: 0,
      borderTop: `1px solid ${theme === "dark" ? '#27272a' : '#e5e7eb'}`,
      zIndex: 10,
    },
    inputWrapper: {
      flex: 1,
      backgroundColor: theme === "dark" ? '#27272a' : 'white',
      borderRadius: '24px',
      padding: '10px 16px',
      display: 'flex',
      alignItems: 'center',
      minHeight: '44px',
      border: '1px solid transparent',
    },
    input: {
      flex: 1,
      backgroundColor: 'transparent',
      border: 'none',
      outline: 'none',
      fontSize: '16px', // Prevent zoom on iOS
      color: theme === "dark" ? 'white' : 'black',
      width: '100%',
      padding: 0,
      margin: 0,
      fontFamily: 'inherit',
    },
    sendButton: (disabled: boolean) => ({
      width: '44px',
      height: '44px',
      borderRadius: '50%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: disabled
        ? (theme === "dark" ? '#27272a' : '#e5e7eb')
        : '#059669',
      color: disabled
        ? (theme === "dark" ? '#71717a' : '#9ca3af')
        : 'white',
      border: 'none',
      cursor: disabled ? 'not-allowed' : 'pointer',
      transition: 'all 0.2s',
      flexShrink: 0,
    }),
  };

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <div style={styles.headerContent}>
          <div style={styles.avatar}>
            <div style={styles.avatarCircle}>
              <span>👩‍💼</span>
            </div>
            <div style={styles.onlineIndicator}></div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <h1 style={styles.headerTitle}>Sofia</h1>
            <p style={styles.headerStatus}>Online agora</p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div style={styles.messagesContainer}>
        {messages.map((message) => {
          const isUser = message.tipo === "user";
          return (
            <div key={message.id} style={styles.messageRow(isUser)}>
              <div style={styles.bubble(isUser)}>
                <div style={{ whiteSpace: 'pre-line' }}>
                  {renderMarkdown(message.texto)}
                </div>

                <div style={styles.timestamp(isUser)}>
                  <span>{formatTime(message.timestamp)}</span>
                  {isUser && (
                    <CheckCheck
                      size={14}
                      color={message.status === "read" ? "#93c5fd" : "currentColor"}
                    />
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {sending && (
          <div style={styles.messageRow(false)}>
            <div style={{ ...styles.bubble(false), padding: '12px 16px' }}>
              <Loading size="sm" color="emerald" inline />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div style={styles.inputContainer}>
        <div style={styles.inputWrapper}>
          <input
            type="text"
            placeholder="Digite uma mensagem..."
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !sending && handleSendMessage()}
            disabled={sending}
            style={styles.input}
          />
        </div>

        <button
          onClick={handleSendMessage}
          disabled={sending || !inputValue.trim()}
          style={styles.sendButton(sending || !inputValue.trim())}
        >
          {sending ? (
            <Loading size="sm" color="white" inline />
          ) : (
            <Send size={20} style={{ marginLeft: '2px' }} />
          )}
        </button>
      </div>
    </div>
  );
}