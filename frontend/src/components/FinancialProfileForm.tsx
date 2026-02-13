import { useState } from 'react';
import { 
  User, 
  Wallet,
  TrendingUp, 
  Target,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  Heart,
  Home,
  Plane,
  Car,
  Coins,
  CreditCard,
  GraduationCap,
  Zap,
  Shield,
  TrendingDown,
  DollarSign,
  ArrowLeft
} from 'lucide-react';
import { userService, FinancialProfile } from "../services/user.service";
import { useTheme } from "../contexts/ThemeContext";

interface FinancialProfileFormProps {
  onComplete: () => void;
  onSkip?: () => void;
}

interface FormData {
  nome: string;
  idade: string;
  rendaEstimada: string;
  situacaoFinanceira: 'dividas' | 'equilibrio' | 'investindo';
  tiposDividas: string[];
  comprometimentoRenda: string;
  possuiReserva: 'sim' | 'nao';
  tempoReserva: string;
  conhecimentoInvestimento: string;
  investimentosAtuais: string[];
  objetivoPrincipal: string;
  prazoObjetivo: string;
}

export default function FinancialProfileForm({ onComplete, onSkip }: FinancialProfileFormProps) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  
  const [step, setStep] = useState(0);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [formData, setFormData] = useState<FormData>({
    nome: '',
    idade: '',
    rendaEstimada: '',
    situacaoFinanceira: 'equilibrio',
    tiposDividas: [],
    comprometimentoRenda: '',
    possuiReserva: 'nao',
    tempoReserva: '',
    conhecimentoInvestimento: '',
    investimentosAtuais: [],
    objetivoPrincipal: '',
    prazoObjetivo: ''
  });

  const totalSteps = 6;

  // Theme-based colors
  const colors = {
    bg: isDark ? 'bg-zinc-950' : 'bg-gray-50',
    card: isDark ? 'bg-zinc-900' : 'bg-white',
    cardHover: isDark ? 'hover:bg-zinc-800' : 'hover:bg-gray-50',
    text: isDark ? 'text-white' : 'text-gray-900',
    textSecondary: isDark ? 'text-zinc-400' : 'text-gray-600',
    border: isDark ? 'border-zinc-800' : 'border-gray-200',
    borderHover: isDark ? 'hover:border-zinc-700' : 'hover:border-gray-300',
    input: isDark ? 'bg-zinc-950 border-zinc-800' : 'bg-white border-gray-200',
    inputFocus: isDark ? 'focus:border-emerald-500 focus:bg-zinc-900' : 'focus:border-emerald-500 focus:bg-gray-50',
    accent: 'bg-emerald-500',
    accentHover: 'hover:bg-emerald-600',
    accentText: 'text-emerald-500',
    selected: isDark ? 'bg-emerald-500 text-zinc-950 border-emerald-500' : 'bg-emerald-500 text-white border-emerald-500',
    selectedShadow: 'shadow-[0_4px_20px_rgba(16,185,129,0.3)]',
    progress: isDark ? 'bg-zinc-800' : 'bg-gray-200',
  };

  const handleCheckboxChange = (value: string, field: 'tiposDividas' | 'investimentosAtuais') => {
    setFormData(prev => {
      const currentList = [...prev[field]];
      if (currentList.includes(value)) {
        return { ...prev, [field]: currentList.filter(item => item !== value) };
      } else {
        return { ...prev, [field]: [...currentList, value] };
      }
    });
  };

  const nextStep = () => {
    if (step < totalSteps - 1) setStep(step + 1);
  };

  const prevStep = () => {
    if (step > 0) setStep(step - 1);
  };

  const canProceed = () => {
    switch(step) {
      case 0: return formData.nome.trim().length > 0 && formData.idade.trim().length > 0;
      case 1: return formData.rendaEstimada.length > 0;
      case 2: return formData.situacaoFinanceira.length > 0;
      case 3: return formData.possuiReserva.length > 0;
      case 4: return formData.conhecimentoInvestimento.length > 0;
      case 5: return formData.objetivoPrincipal.length > 0 && formData.prazoObjetivo.length > 0;
      default: return true;
    }
  };

  const mapToProfile = (data: FormData): FinancialProfile => {
    return {
      ageRange: data.idade,
      monthlyIncomeRange: data.rendaEstimada,
      hasDebts: data.situacaoFinanceira === 'dividas',
      debtTypes: data.tiposDividas,
      monthlyExpensePercentage: data.comprometimentoRenda,
      hasEmergencyFund: data.possuiReserva === 'sim',
      emergencyFundMonths: data.tempoReserva,
      investmentExperience: data.conhecimentoInvestimento,
      currentInvestments: data.investimentosAtuais,
      mainFinancialGoals: [data.objetivoPrincipal],
      biggestFinancialChallenge: data.situacaoFinanceira,
      profileCompleted: true
    };
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const profileData = mapToProfile(formData);
      await userService.saveFinancialProfile(profileData);
      setIsSubmitted(true);
    } catch (error) {
      console.error("Erro ao salvar perfil:", error);
      setIsSubmitted(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderProgressBar = () => {
    const progress = ((step + 1) / totalSteps) * 100;
    return (
      <div className="fixed top-0 left-0 right-0 z-50">
        <div className={`h-1 ${colors.progress}`}>
          <div 
            className="h-full bg-emerald-500 transition-all duration-300 ease-out" 
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    );
  };

  // Estilos base para sobrescrever o CSS
  const baseButtonStyle: React.CSSProperties = {
    fontSize: '1rem',
    fontWeight: '700',
    lineHeight: '1.5',
    padding: '1.25rem 1.5rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  };

  const baseInputStyle: React.CSSProperties = {
    fontSize: '1.125rem',
    fontWeight: '400',
    lineHeight: '1.5',
    padding: '1rem 1.25rem',
  };

  const baseLabelStyle: React.CSSProperties = {
    fontSize: '0.75rem',
    fontWeight: '700',
    lineHeight: '1.2',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  };

  const baseTitleStyle: React.CSSProperties = {
    fontSize: '1.875rem',
    fontWeight: '900',
    lineHeight: '1.2',
  };

  const baseSubtitleStyle: React.CSSProperties = {
    fontSize: '1rem',
    fontWeight: '400',
    lineHeight: '2.6',
  };

  if (isSubmitted) {
    const firstName = formData.nome.split(' ')[0];
    return (
      <div className={`min-h-screen ${colors.bg} flex items-center justify-center p-6`}>
        <div className={`${colors.card} rounded-3xl p-8 max-w-md w-full text-center shadow-2xl`}>
          <div className="mb-6 flex justify-center">
            <div className="bg-emerald-500/10 p-6 rounded-full">
              <CheckCircle2 className="w-16 h-16 text-emerald-500" />
            </div>
          </div>
          
          <h2 className={colors.text} style={baseTitleStyle}>
            Pronto, {firstName}! 🎉
          </h2>
          
          <p className={`${colors.textSecondary} mt-3 mb-8`} style={{ ...baseSubtitleStyle, fontSize: '1.125rem' }}>
            Seu perfil foi salvo com sucesso. Agora vamos criar seu plano financeiro personalizado.
          </p>
          
          <button 
            onClick={onComplete}
            className="w-full bg-emerald-500 hover:bg-emerald-600 text-white rounded-2xl transition-all shadow-lg active:scale-95"
            style={{ ...baseButtonStyle, gap: '0.5rem' }}
          >
            Começar Jornada
            <Sparkles size={22} />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${colors.bg} flex flex-col`}>
      {renderProgressBar()}
      
      <div className="flex-1 flex flex-col pt-8 px-8 pb-10">
        {/* Header */}
        <div className="mb-8 px-6"> <br />
          <div className="flex justify-between items-center mb-6">
            {step > 0 ? (
              <button 
                onClick={prevStep}
                className={`${colors.textSecondary} transition-colors`}
                style={{ fontSize: '0.875rem', fontWeight: '600' }}
              >
                <ArrowLeft className="inline w-6 h-6 mr-1" />
              </button>
            ) : (
              <div></div>
            )}
            
            {onSkip && (
              <button 
                onClick={onSkip}
                className={`${colors.textSecondary} transition-colors`}
                style={{ fontSize: '0.875rem', fontWeight: '600' }}
              >
                Pular
              </button>
            )}
          </div>
          
          <div>
            <div className={`${colors.accentText} mb-2`} style={baseLabelStyle}>
              Etapa {step + 1} de {totalSteps}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto -mx-6 px-6">
          {/* Step 0: Nome e Idade */}
          {step === 0 && (
            <div className="space-y-8">
              <div>
                <h2 className={`${colors.text} mb-3`} style={baseTitleStyle}>
                  Vamos nos conhecer! 👋
                </h2>
                <p className={colors.textSecondary} style={baseSubtitleStyle}>
                  Como você gostaria de ser chamado?
                </p>
              </div>

              <div className="space-y-5">
                <div>
                  <label className={`block ${colors.textSecondary} mb-3`} style={baseLabelStyle}>
                    Seu nome
                  </label>
                  <input 
                    type="text"
                    value={formData.nome}
                    onChange={(e) => setFormData(prev => ({ ...prev, nome: e.target.value }))}
                    placeholder="Digite aqui..."
                    className={`w-full rounded-2xl border-2 ${colors.input} ${colors.inputFocus} ${colors.text} outline-none transition-all`}
                    style={baseInputStyle}
                    autoFocus
                  />
                </div>

                <div>
                  <label className={`block ${colors.textSecondary} mb-3`} style={baseLabelStyle}>
                    Sua idade
                  </label>
                  <input 
                    type="number"
                    value={formData.idade}
                    onChange={(e) => setFormData(prev => ({ ...prev, idade: e.target.value }))}
                    placeholder="00"
                    className={`w-full rounded-2xl border-2 ${colors.input} ${colors.inputFocus} ${colors.text} outline-none transition-all`}
                    style={baseInputStyle}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 1: Renda */}
          {step === 1 && (
            <div className="space-y-8">
              <div>
                <h2 className={`${colors.text} mb-3`} style={baseTitleStyle}>
                  Qual sua renda mensal? 💰
                </h2>
                <p className={colors.textSecondary} style={baseSubtitleStyle}>
                  Uma estimativa ajuda a criar seu plano ideal
                </p>
              </div>

              <div className="space-y-4">
                {[
                  { value: "Até R$ 2.000", emoji: "🌱" },
                  { value: "R$ 2.000 - R$ 5.000", emoji: "🌿" },
                  { value: "R$ 5.000 - R$ 10.000", emoji: "🌳" },
                  { value: "R$ 10.000 - R$ 20.000", emoji: "🏆" },
                  { value: "Acima de R$ 20.000", emoji: "💎" }
                ].map(item => (
                  <button
                    key={item.value}
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, rendaEstimada: item.value }))}
                    className={`w-full rounded-2xl border-2 transition-all text-left ${
                      formData.rendaEstimada === item.value 
                        ? `${colors.selected} ${colors.selectedShadow} scale-[1.02]` 
                        : `${colors.card} ${colors.border} ${colors.cardHover} ${colors.text}`
                    }`}
                    style={{ ...baseButtonStyle, gap: '1rem', justifyContent: 'flex-start' }}
                  >
                    <span style={{ fontSize: '1.5rem' }}>{item.emoji}</span>
                    <span>{item.value}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 2: Situação Financeira */}
          {step === 2 && (
            <div className="space-y-8">
              <div>
                <h2 className={`${colors.text} mb-3`} style={baseTitleStyle}>
                  Como está sua vida financeira hoje? 🎯
                </h2>
                <p className={colors.textSecondary} style={baseSubtitleStyle}>
                  Seja sincero, sem julgamentos aqui
                </p>
              </div>

              <div className="space-y-4">
                {[
                  { 
                    value: 'dividas', 
                    label: 'Tenho dívidas para pagar',
                    icon: TrendingDown,
                    color: 'text-red-500',
                    bgColor: isDark ? 'bg-red-500/10' : 'bg-red-50'
                  },
                  { 
                    value: 'equilibrio', 
                    label: 'Estou no equilíbrio',
                    icon: Wallet,
                    color: 'text-blue-500',
                    bgColor: isDark ? 'bg-blue-500/10' : 'bg-blue-50'
                  },
                  { 
                    value: 'investindo', 
                    label: 'Já estou investindo',
                    icon: TrendingUp,
                    color: 'text-emerald-500',
                    bgColor: isDark ? 'bg-emerald-500/10' : 'bg-emerald-50'
                  }
                ].map(item => {
                  const Icon = item.icon;
                  const isSelected = formData.situacaoFinanceira === item.value;
                  return (
                    <button
                      key={item.value}
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, situacaoFinanceira: item.value as any }))}
                      className={`w-full rounded-2xl border-2 transition-all text-left ${
                        isSelected
                          ? `bg-emerald-500 text-white border-emerald-500 ${colors.selectedShadow} scale-[1.02]` 
                          : `${colors.card} ${colors.border} ${colors.cardHover}`
                      }`}
                      style={{ ...baseButtonStyle, padding: '1.5rem', justifyContent: 'flex-start' }}
                    >
                      <div className="flex items-center gap-4">
                        <div className={`p-3 rounded-xl ${isSelected ? 'bg-white/20' : item.bgColor}`}>
                          <Icon className={`w-6 h-6 ${isSelected ? 'text-white' : item.color}`} />
                        </div>
                        <span style={{ fontSize: '1rem', fontWeight: '700' }}>
                          {item.label}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Se tem dívidas, perguntar tipos */}
              {formData.situacaoFinanceira === 'dividas' && (
                <div className="space-y-5 pt-4">
                  <label className={`block ${colors.text}`} style={{ fontSize: '0.875rem', fontWeight: '700' }}>
                    Que tipo de dívidas?
                  </label>
                  <div className="grid grid-cols-2 gap-3" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)' }}>
                    {[
                      { value: 'Cartão', icon: CreditCard },
                      { value: 'Empréstimo', icon: DollarSign },
                      { value: 'Financiamento', icon: Car },
                      { value: 'Imóvel', icon: Home },
                      { value: 'Estudantil', icon: GraduationCap },
                      { value: 'Outro', icon: Coins }
                    ].map(item => {
                      const Icon = item.icon;
                      const isSelected = formData.tiposDividas.includes(item.value);
                      return (
                        <button
                          key={item.value}
                          type="button"
                          onClick={() => handleCheckboxChange(item.value, 'tiposDividas')}
                          className={`rounded-xl border-2 transition-all relative ${
                            isSelected
                              ? `border-emerald-500 bg-emerald-500 text-white` 
                              : `${colors.card} ${colors.border} ${colors.text}`
                          }`}
                          style={{ padding: '1rem', fontSize: '0.75rem', fontWeight: '700', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '90px' }}
                        >
                          {/* Checkbox visual */}
                          <div 
                            className={`absolute top-2 right-2 w-5 h-5 rounded border-2 flex items-center justify-center ${
                              isSelected 
                                ? 'bg-white border-white' 
                                : isDark ? 'border-zinc-600 bg-zinc-800' : 'border-gray-300 bg-white'
                            }`}
                            style={{ width: '20px', height: '20px' }}
                          >
                            {isSelected && (
                              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                                <path d="M11.6666 3.5L5.24992 9.91667L2.33325 7" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                              </svg>
                            )}
                          </div>
                          
                          <Icon className={`w-5 h-5 mb-2 ${isSelected ? 'text-white' : colors.textSecondary}`} />
                          {item.value}
                        </button>
                      );
                    })}
                  </div>

                  <div>
                    <label className={`block ${colors.text} mb-3`} style={{ fontSize: '0.875rem', fontWeight: '700' }}>
                      Quanto % da renda vai para dívidas?
                    </label>
                    <select 
                      value={formData.comprometimentoRenda}
                      onChange={(e) => setFormData(prev => ({ ...prev, comprometimentoRenda: e.target.value }))}
                      className={`w-full rounded-2xl border-2 ${colors.input} ${colors.inputFocus} ${colors.text} outline-none`}
                      style={{ 
                        padding: '1rem 1.25rem', 
                        fontSize: '1rem', 
                        fontWeight: '600',
                        backgroundColor: isDark ? '#09090b' : '#ffffff',
                        color: isDark ? '#ffffff' : '#000000'
                      }}
                    >
                      <option value="" style={{ backgroundColor: isDark ? '#18181b' : '#ffffff', color: isDark ? '#ffffff' : '#000000' }}>Selecione...</option>
                      <option value="Menos de 10%" style={{ backgroundColor: isDark ? '#18181b' : '#ffffff', color: isDark ? '#ffffff' : '#000000' }}>Menos de 10%</option>
                      <option value="10% a 30%" style={{ backgroundColor: isDark ? '#18181b' : '#ffffff', color: isDark ? '#ffffff' : '#000000' }}>10% a 30%</option>
                      <option value="30% a 50%" style={{ backgroundColor: isDark ? '#18181b' : '#ffffff', color: isDark ? '#ffffff' : '#000000' }}>30% a 50%</option>
                      <option value="Mais de 50%" style={{ backgroundColor: isDark ? '#18181b' : '#ffffff', color: isDark ? '#ffffff' : '#000000' }}>Mais de 50%</option>
                    </select>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Step 3: Reserva de Emergência */}
          {step === 3 && (
            <div className="space-y-8">
              <div>
                <h2 className={`${colors.text} mb-3`} style={baseTitleStyle}>
                  Tem um dinheiro guardado? 🛡️
                </h2>
                <p className={colors.textSecondary} style={baseSubtitleStyle}>
                  Uma reserva é essencial para emergências
                </p>
              </div>

              <div className="space-y-4">
                {[
                  { value: 'sim', label: 'Sim, tenho!', emoji: '✅' },
                  { value: 'nao', label: 'Ainda não', emoji: '⏳' }
                ].map(item => (
                  <button
                    key={item.value}
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, possuiReserva: item.value as 'sim' | 'nao' }))}
                    className={`w-full rounded-2xl border-2 transition-all text-left ${
                      formData.possuiReserva === item.value 
                        ? `bg-emerald-500 text-white border-emerald-500 ${colors.selectedShadow} scale-[1.02]` 
                        : `${colors.card} ${colors.border} ${colors.cardHover} ${colors.text}`
                    }`}
                    style={{ ...baseButtonStyle, gap: '1rem', justifyContent: 'flex-start' }}
                  >
                    <span style={{ fontSize: '1.5rem' }}>{item.emoji}</span>
                    <span>{item.label}</span>
                  </button>
                ))}
              </div>

              {formData.possuiReserva === 'sim' && (
                <div className="space-y-4 pt-4">
                  <label className={`block ${colors.text}`} style={{ fontSize: '0.875rem', fontWeight: '700' }}>
                    Quanto tempo ela cobre seus gastos?
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      "1-3 meses",
                      "3-6 meses",
                      "6-12 meses",
                      "+12 meses"
                    ].map(tempo => (
                      <button
                        key={tempo}
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, tempoReserva: tempo }))}
                        className={`rounded-xl border-2 transition-all ${
                          formData.tempoReserva === tempo 
                            ? `border-emerald-500 bg-emerald-500 text-white` 
                            : `${colors.card} ${colors.border} ${colors.text}`
                        }`}
                        style={{ padding: '1rem', fontSize: '0.875rem', fontWeight: '700' }}
                      >
                        {tempo}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Step 4: Conhecimento */}
          {step === 4 && (
            <div className="space-y-8">
              <div>
                <h2 className={`${colors.text} mb-3`} style={baseTitleStyle}>
                  Qual seu nível com investimentos? 📚
                </h2>
                <p className={colors.textSecondary} style={baseSubtitleStyle}>
                  Sem vergonha! Todo mundo começa do zero
                </p>
              </div>

              <div className="space-y-4">
                {[
                  { value: 'Iniciante', label: 'Nunca investi', emoji: '🌱', desc: 'Estou começando agora' },
                  { value: 'Básico', label: 'Já dei os primeiros passos', emoji: '🌿', desc: 'Sei o básico' },
                  { value: 'Intermediário', label: 'Já invisto há um tempo', emoji: '🌳', desc: 'Conheço o mercado' },
                  { value: 'Avançado', label: 'Sou experiente', emoji: '🏆', desc: 'Domino estratégias' }
                ].map(item => (
                  <button
                    key={item.value}
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, conhecimentoInvestimento: item.value }))}
                    className={`w-full rounded-2xl border-2 transition-all text-left ${
                      formData.conhecimentoInvestimento === item.value 
                        ? `bg-emerald-500 text-white border-emerald-500 ${colors.selectedShadow} scale-[1.02]` 
                        : `${colors.card} ${colors.border} ${colors.cardHover}`
                    }`}
                    style={{ padding: '1.25rem 1.5rem' }}
                  >
                    <div className="flex items-start gap-4">
                      <span style={{ fontSize: '1.5rem', marginTop: '0.25rem', flexShrink: 0 }}>{item.emoji}</span>
                      <div className="flex-1 text-left">
                        <div className={`mb-1`} style={{ fontSize: '1rem', fontWeight: '700', textAlign: 'left' }}>
                          {item.label}
                        </div>
                        <div className={formData.conhecimentoInvestimento === item.value ? 'text-white/70' : colors.textSecondary} style={{ fontSize: '0.75rem', textAlign: 'left' }}>
                          {item.desc}
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>

              {formData.conhecimentoInvestimento && formData.conhecimentoInvestimento !== 'Iniciante' && (
                <div className="space-y-4 pt-4">
                  <label className={`block ${colors.text}`} style={{ fontSize: '0.875rem', fontWeight: '700' }}>
                    Onde você já investe? (pode marcar mais de uma)
                  </label>
                  <div className="grid grid-cols-2 gap-3" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)' }}>
                    {[
                      'Poupança',
                      'Tesouro',
                      'CDB',
                      'Ações',
                      'FIIs',
                      'Cripto'
                    ].map(inv => {
                      const isSelected = formData.investimentosAtuais.includes(inv);
                      return (
                        <button
                          key={inv}
                          type="button"
                          onClick={() => handleCheckboxChange(inv, 'investimentosAtuais')}
                          className={`rounded-xl border-2 transition-all relative ${
                            isSelected
                              ? `border-emerald-500 bg-emerald-500 text-white` 
                              : `${colors.card} ${colors.border} ${colors.text}`
                          }`}
                          style={{ padding: '1rem 0.875rem', fontSize: '0.875rem', fontWeight: '700', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60px', position: 'relative' }}
                        >
                          {/* Checkbox visual */}
                          <div 
                            className={`absolute top-2 right-2 w-5 h-5 rounded border-2 flex items-center justify-center ${
                              isSelected 
                                ? 'bg-white border-white' 
                                : isDark ? 'border-zinc-600 bg-zinc-800' : 'border-gray-300 bg-white'
                            }`}
                            style={{ width: '18px', height: '18px' }}
                          >
                            {isSelected && (
                              <svg width="12" height="12" viewBox="0 0 14 14" fill="none">
                                <path d="M11.6666 3.5L5.24992 9.91667L2.33325 7" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                              </svg>
                            )}
                          </div>
                          
                          {inv}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Step 5: Objetivos */}
          {step === 5 && (
            <div className="space-y-8">
              <div>
                <h2 className={`${colors.text} mb-3`} style={baseTitleStyle}>
                  Qual seu maior sonho? ✨
                </h2>
                <p className={colors.textSecondary} style={baseSubtitleStyle}>
                  Vamos construir o caminho até ele
                </p>
              </div>

              <div className="space-y-4">
                {[
                  { value: 'Aposentadoria', label: 'Aposentadoria tranquila', icon: Heart, color: 'text-pink-500' },
                  { value: 'Casa própria', label: 'Comprar minha casa', icon: Home, color: 'text-blue-500' },
                  { value: 'Viajar', label: 'Viajar pelo mundo', icon: Plane, color: 'text-purple-500' },
                  { value: 'Carro', label: 'Trocar de carro', icon: Car, color: 'text-orange-500' },
                  { value: 'Liberdade financeira', label: 'Liberdade financeira', icon: Zap, color: 'text-yellow-500' },
                  { value: 'Reserva', label: 'Criar uma reserva', icon: Shield, color: 'text-emerald-500' }
                ].map(item => {
                  const Icon = item.icon;
                  const isSelected = formData.objetivoPrincipal === item.value;
                  return (
                    <button
                      key={item.value}
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, objetivoPrincipal: item.value }))}
                      className={`w-full rounded-2xl border-2 transition-all text-left ${
                        isSelected
                          ? `bg-emerald-500 text-white border-emerald-500 ${colors.selectedShadow} scale-[1.02]` 
                          : `${colors.card} ${colors.border} ${colors.cardHover}`
                      }`}
                      style={{ ...baseButtonStyle, padding: '1.25rem 1.5rem', justifyContent: 'flex-start' }}
                    >
                      <div className="flex items-center gap-4">
                        <div className={`p-3 rounded-xl ${isSelected ? 'bg-white/20' : isDark ? 'bg-zinc-800' : 'bg-gray-100'}`}>
                          <Icon className={`w-6 h-6 ${isSelected ? 'text-white' : item.color}`} />
                        </div>
                        <span style={{ fontSize: '1rem', fontWeight: '700' }}>
                          {item.label}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>

              {formData.objetivoPrincipal && (
                <div className="space-y-4 pt-4">
                  <label className={`block ${colors.text}`} style={{ fontSize: '0.875rem', fontWeight: '700' }}>
                    Em quanto tempo você quer alcançar?
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      "Até 1 ano",
                      "1-3 anos",
                      "3-5 anos",
                      "5+ anos"
                    ].map(prazo => (
                      <button
                        key={prazo}
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, prazoObjetivo: prazo }))}
                        className={`rounded-xl border-2 transition-all ${
                          formData.prazoObjetivo === prazo 
                            ? `border-emerald-500 bg-emerald-500 text-white` 
                            : `${colors.card} ${colors.border} ${colors.text}`
                        }`}
                        style={{ padding: '1rem', fontSize: '0.875rem', fontWeight: '700' }}
                      >
                        {prazo}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer Button */}
        <div className="mt-8 pt-5 px-6">
          {step < totalSteps - 1 ? (
            <button
              type="button"
              onClick={nextStep}
              disabled={!canProceed()}
              className={`w-full rounded-2xl transition-all ${
                canProceed() 
                  ? 'bg-emerald-500 hover:bg-emerald-600 text-white active:scale-95 shadow-lg shadow-emerald-500/30' 
                  : `${colors.card} ${colors.border} ${colors.textSecondary} cursor-not-allowed opacity-40`
              }`}
              style={{ ...baseButtonStyle, gap: '0.5rem' }}
            >
              Continuar
              <ArrowRight size={20} />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={!canProceed() || isSubmitting}
              className={`w-full rounded-2xl transition-all ${
                canProceed() && !isSubmitting
                  ? 'bg-emerald-500 hover:bg-emerald-600 text-white active:scale-95 shadow-lg shadow-emerald-500/30' 
                  : `${colors.card} ${colors.border} ${colors.textSecondary} cursor-not-allowed opacity-40`
              }`}
              style={{ ...baseButtonStyle, gap: '0.5rem' }}
            >
              {isSubmitting ? 'Salvando...' : 'Finalizar'}
              <Sparkles size={20} />
            </button>
          )}
          <br />
        </div>
      </div>
    </div>
  );
}