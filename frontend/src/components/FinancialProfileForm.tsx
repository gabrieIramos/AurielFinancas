import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  ChevronRight, 
  ChevronLeft, 
  User, 
  DollarSign, 
  CreditCard, 
  PiggyBank, 
  TrendingUp, 
  Target,
  Loader2,
  Check,
  Sparkles
} from "lucide-react";
import { useTheme } from "../contexts/ThemeContext";
import { userService, FinancialProfile } from "../services/user.service";

interface FinancialProfileFormProps {
  onComplete: () => void;
  onSkip?: () => void;
}

type Step = {
  id: string;
  title: string;
  subtitle: string;
  icon: React.ReactNode;
};

const steps: Step[] = [
  { id: "personal", title: "Sobre você", subtitle: "Informações básicas", icon: <User className="w-5 h-5" /> },
  { id: "income", title: "Renda", subtitle: "Sua situação financeira", icon: <DollarSign className="w-5 h-5" /> },
  { id: "expenses", title: "Despesas", subtitle: "Como você gasta", icon: <CreditCard className="w-5 h-5" /> },
  { id: "emergency", title: "Reserva", subtitle: "Segurança financeira", icon: <PiggyBank className="w-5 h-5" /> },
  { id: "investments", title: "Investimentos", subtitle: "Sua experiência", icon: <TrendingUp className="w-5 h-5" /> },
  { id: "goals", title: "Objetivos", subtitle: "Seus sonhos", icon: <Target className="w-5 h-5" /> },
];

export default function FinancialProfileForm({ onComplete, onSkip }: FinancialProfileFormProps) {
  const { theme } = useTheme();
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<FinancialProfile>({
    hasDebts: false,
    hasEmergencyFund: false,
    debtTypes: [],
    currentInvestments: [],
    mainFinancialGoals: [],
  });

  const updateField = (field: keyof FinancialProfile, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const toggleArrayField = (field: 'debtTypes' | 'currentInvestments' | 'mainFinancialGoals', value: string) => {
    setFormData(prev => {
      const current = prev[field] || [];
      const newArray = current.includes(value) 
        ? current.filter(v => v !== value)
        : [...current, value];
      return { ...prev, [field]: newArray };
    });
  };

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      await userService.saveFinancialProfile(formData);
      onComplete();
    } catch (error) {
      console.error('Erro ao salvar perfil:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const OptionButton = ({ 
    selected, 
    onClick, 
    children 
  }: { 
    selected: boolean; 
    onClick: () => void; 
    children: React.ReactNode;
  }) => (
    <button
      onClick={onClick}
      className={`w-full p-4 rounded-xl text-left transition-all ${
        selected
          ? "bg-emerald-600 text-white"
          : theme === "dark"
          ? "bg-zinc-800 text-white hover:bg-zinc-700"
          : "bg-zinc-100 text-black hover:bg-zinc-200"
      }`}
    >
      {children}
    </button>
  );

  const MultiSelectButton = ({ 
    selected, 
    onClick, 
    children 
  }: { 
    selected: boolean; 
    onClick: () => void; 
    children: React.ReactNode;
  }) => (
    <button
      onClick={onClick}
      className={`p-3 rounded-xl text-sm transition-all flex items-center gap-2 ${
        selected
          ? "bg-emerald-600 text-white"
          : theme === "dark"
          ? "bg-zinc-800 text-white hover:bg-zinc-700"
          : "bg-zinc-100 text-black hover:bg-zinc-200"
      }`}
    >
      {selected && <Check className="w-4 h-4" />}
      {children}
    </button>
  );

  const renderStepContent = () => {
    switch (steps[currentStep].id) {
      case "personal":
        return (
          <div className="space-y-6">
            <div>
              <label className={`block text-sm mb-3 ${theme === "dark" ? "text-zinc-400" : "text-zinc-600"}`}>
                Qual sua faixa etária?
              </label>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { value: "18-24", label: "18 a 24 anos" },
                  { value: "25-34", label: "25 a 34 anos" },
                  { value: "35-44", label: "35 a 44 anos" },
                  { value: "45-54", label: "45 a 54 anos" },
                  { value: "55-64", label: "55 a 64 anos" },
                  { value: "65+", label: "65+ anos" },
                ].map(option => (
                  <OptionButton
                    key={option.value}
                    selected={formData.ageRange === option.value}
                    onClick={() => updateField("ageRange", option.value)}
                  >
                    {option.label}
                  </OptionButton>
                ))}
              </div>
            </div>

            <div>
              <label className={`block text-sm mb-3 ${theme === "dark" ? "text-zinc-400" : "text-zinc-600"}`}>
                Qual sua ocupação principal?
              </label>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { value: "employed", label: "Empregado CLT" },
                  { value: "self-employed", label: "Autônomo" },
                  { value: "entrepreneur", label: "Empresário" },
                  { value: "student", label: "Estudante" },
                  { value: "retired", label: "Aposentado" },
                  { value: "other", label: "Outro" },
                ].map(option => (
                  <OptionButton
                    key={option.value}
                    selected={formData.occupation === option.value}
                    onClick={() => updateField("occupation", option.value)}
                  >
                    {option.label}
                  </OptionButton>
                ))}
              </div>
            </div>
          </div>
        );

      case "income":
        return (
          <div className="space-y-6">
            <div>
              <label className={`block text-sm mb-3 ${theme === "dark" ? "text-zinc-400" : "text-zinc-600"}`}>
                Qual sua renda mensal aproximada?
              </label>
              <div className="space-y-3">
                {[
                  { value: "up-to-2k", label: "Até R$ 2.000" },
                  { value: "2k-5k", label: "R$ 2.000 a R$ 5.000" },
                  { value: "5k-10k", label: "R$ 5.000 a R$ 10.000" },
                  { value: "10k-20k", label: "R$ 10.000 a R$ 20.000" },
                  { value: "20k-50k", label: "R$ 20.000 a R$ 50.000" },
                  { value: "50k+", label: "Acima de R$ 50.000" },
                ].map(option => (
                  <OptionButton
                    key={option.value}
                    selected={formData.monthlyIncomeRange === option.value}
                    onClick={() => updateField("monthlyIncomeRange", option.value)}
                  >
                    {option.label}
                  </OptionButton>
                ))}
              </div>
            </div>

            <div>
              <label className={`block text-sm mb-3 ${theme === "dark" ? "text-zinc-400" : "text-zinc-600"}`}>
                Como é a estabilidade da sua renda?
              </label>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { value: "stable", label: "Estável" },
                  { value: "mostly-stable", label: "Maior parte estável" },
                  { value: "mostly-variable", label: "Maior parte variável" },
                  { value: "variable", label: "Totalmente variável" },
                ].map(option => (
                  <OptionButton
                    key={option.value}
                    selected={formData.incomeStability === option.value}
                    onClick={() => updateField("incomeStability", option.value)}
                  >
                    {option.label}
                  </OptionButton>
                ))}
              </div>
            </div>
          </div>
        );

      case "expenses":
        return (
          <div className="space-y-6">
            <div>
              <label className={`block text-sm mb-3 ${theme === "dark" ? "text-zinc-400" : "text-zinc-600"}`}>
                Quanto da sua renda você gasta por mês?
              </label>
              <div className="space-y-3">
                {[
                  { value: "less-30", label: "Menos de 30% - Sobra bastante" },
                  { value: "30-50", label: "30% a 50% - Sobra razoável" },
                  { value: "50-70", label: "50% a 70% - Sobra um pouco" },
                  { value: "70-90", label: "70% a 90% - Sobra quase nada" },
                  { value: "more-90", label: "Mais de 90% - Não sobra nada" },
                ].map(option => (
                  <OptionButton
                    key={option.value}
                    selected={formData.monthlyExpensePercentage === option.value}
                    onClick={() => updateField("monthlyExpensePercentage", option.value)}
                  >
                    {option.label}
                  </OptionButton>
                ))}
              </div>
            </div>

            <div>
              <label className={`block text-sm mb-3 ${theme === "dark" ? "text-zinc-400" : "text-zinc-600"}`}>
                Você possui dívidas atualmente?
              </label>
              <div className="grid grid-cols-2 gap-3">
                <OptionButton
                  selected={formData.hasDebts === true}
                  onClick={() => updateField("hasDebts", true)}
                >
                  Sim
                </OptionButton>
                <OptionButton
                  selected={formData.hasDebts === false}
                  onClick={() => updateField("hasDebts", false)}
                >
                  Não
                </OptionButton>
              </div>
            </div>

            {formData.hasDebts && (
              <div>
                <label className={`block text-sm mb-3 ${theme === "dark" ? "text-zinc-400" : "text-zinc-600"}`}>
                  Quais tipos de dívidas? (selecione todas)
                </label>
                <div className="flex flex-wrap gap-2">
                  {[
                    { value: "credit-card", label: "Cartão de crédito" },
                    { value: "personal-loan", label: "Empréstimo pessoal" },
                    { value: "financing", label: "Financiamento" },
                    { value: "mortgage", label: "Financ. imobiliário" },
                    { value: "student-loan", label: "Estudantil" },
                    { value: "other", label: "Outros" },
                  ].map(option => (
                    <MultiSelectButton
                      key={option.value}
                      selected={formData.debtTypes?.includes(option.value) || false}
                      onClick={() => toggleArrayField("debtTypes", option.value)}
                    >
                      {option.label}
                    </MultiSelectButton>
                  ))}
                </div>
              </div>
            )}
          </div>
        );

      case "emergency":
        return (
          <div className="space-y-6">
            <div>
              <label className={`block text-sm mb-3 ${theme === "dark" ? "text-zinc-400" : "text-zinc-600"}`}>
                Você tem uma reserva de emergência?
              </label>
              <div className="grid grid-cols-2 gap-3">
                <OptionButton
                  selected={formData.hasEmergencyFund === true}
                  onClick={() => updateField("hasEmergencyFund", true)}
                >
                  Sim
                </OptionButton>
                <OptionButton
                  selected={formData.hasEmergencyFund === false}
                  onClick={() => updateField("hasEmergencyFund", false)}
                >
                  Não
                </OptionButton>
              </div>
            </div>

            <div>
              <label className={`block text-sm mb-3 ${theme === "dark" ? "text-zinc-400" : "text-zinc-600"}`}>
                Quanto tempo sua reserva cobriria suas despesas?
              </label>
              <div className="space-y-3">
                {[
                  { value: "none", label: "Não tenho reserva" },
                  { value: "less-3", label: "Menos de 3 meses" },
                  { value: "3-6", label: "3 a 6 meses" },
                  { value: "6-12", label: "6 a 12 meses" },
                  { value: "more-12", label: "Mais de 12 meses" },
                ].map(option => (
                  <OptionButton
                    key={option.value}
                    selected={formData.emergencyFundMonths === option.value}
                    onClick={() => updateField("emergencyFundMonths", option.value)}
                  >
                    {option.label}
                  </OptionButton>
                ))}
              </div>
            </div>
          </div>
        );

      case "investments":
        return (
          <div className="space-y-6">
            <div>
              <label className={`block text-sm mb-3 ${theme === "dark" ? "text-zinc-400" : "text-zinc-600"}`}>
                Qual sua experiência com investimentos?
              </label>
              <div className="space-y-3">
                {[
                  { value: "none", label: "Nenhuma - Nunca investi" },
                  { value: "beginner", label: "Iniciante - Poupança/CDB básico" },
                  { value: "intermediate", label: "Intermediário - Diversificado" },
                  { value: "advanced", label: "Avançado - Estratégias complexas" },
                ].map(option => (
                  <OptionButton
                    key={option.value}
                    selected={formData.investmentExperience === option.value}
                    onClick={() => updateField("investmentExperience", option.value)}
                  >
                    {option.label}
                  </OptionButton>
                ))}
              </div>
            </div>

            <div>
              <label className={`block text-sm mb-3 ${theme === "dark" ? "text-zinc-400" : "text-zinc-600"}`}>
                Onde você investe atualmente? (selecione todos)
              </label>
              <div className="flex flex-wrap gap-2">
                {[
                  { value: "savings", label: "Poupança" },
                  { value: "cdb", label: "CDB/RDB" },
                  { value: "tesouro", label: "Tesouro Direto" },
                  { value: "stocks", label: "Ações" },
                  { value: "fiis", label: "FIIs" },
                  { value: "crypto", label: "Cripto" },
                  { value: "funds", label: "Fundos" },
                  { value: "other", label: "Outros" },
                ].map(option => (
                  <MultiSelectButton
                    key={option.value}
                    selected={formData.currentInvestments?.includes(option.value) || false}
                    onClick={() => toggleArrayField("currentInvestments", option.value)}
                  >
                    {option.label}
                  </MultiSelectButton>
                ))}
              </div>
            </div>

            <div>
              <label className={`block text-sm mb-3 ${theme === "dark" ? "text-zinc-400" : "text-zinc-600"}`}>
                Qual seu perfil de risco?
              </label>
              <div className="space-y-3">
                {[
                  { value: "conservative", label: "Conservador - Prefiro segurança" },
                  { value: "moderate", label: "Moderado - Equilíbrio risco/retorno" },
                  { value: "aggressive", label: "Arrojado - Busco maiores ganhos" },
                ].map(option => (
                  <OptionButton
                    key={option.value}
                    selected={formData.riskTolerance === option.value}
                    onClick={() => updateField("riskTolerance", option.value)}
                  >
                    {option.label}
                  </OptionButton>
                ))}
              </div>
            </div>
          </div>
        );

      case "goals":
        return (
          <div className="space-y-6">
            <div>
              <label className={`block text-sm mb-3 ${theme === "dark" ? "text-zinc-400" : "text-zinc-600"}`}>
                Quais são seus objetivos financeiros? (selecione todos)
              </label>
              <div className="flex flex-wrap gap-2">
                {[
                  { value: "save-more", label: "💰 Economizar mais" },
                  { value: "invest-better", label: "📈 Investir melhor" },
                  { value: "pay-debts", label: "💳 Quitar dívidas" },
                  { value: "build-emergency", label: "🛡️ Reserva de emergência" },
                  { value: "increase-income", label: "💵 Aumentar renda" },
                  { value: "retire-early", label: "🏖️ Aposentar cedo" },
                  { value: "buy-house", label: "🏠 Comprar imóvel" },
                  { value: "travel", label: "✈️ Viajar" },
                ].map(option => (
                  <MultiSelectButton
                    key={option.value}
                    selected={formData.mainFinancialGoals?.includes(option.value) || false}
                    onClick={() => toggleArrayField("mainFinancialGoals", option.value)}
                  >
                    {option.label}
                  </MultiSelectButton>
                ))}
              </div>
            </div>

            <div>
              <label className={`block text-sm mb-3 ${theme === "dark" ? "text-zinc-400" : "text-zinc-600"}`}>
                Qual seu horizonte de investimento?
              </label>
              <div className="space-y-3">
                {[
                  { value: "short-term", label: "Curto prazo (até 2 anos)" },
                  { value: "medium-term", label: "Médio prazo (2 a 5 anos)" },
                  { value: "long-term", label: "Longo prazo (mais de 5 anos)" },
                ].map(option => (
                  <OptionButton
                    key={option.value}
                    selected={formData.investmentHorizon === option.value}
                    onClick={() => updateField("investmentHorizon", option.value)}
                  >
                    {option.label}
                  </OptionButton>
                ))}
              </div>
            </div>

            <div>
              <label className={`block text-sm mb-3 ${theme === "dark" ? "text-zinc-400" : "text-zinc-600"}`}>
                Qual seu maior desafio financeiro hoje?
              </label>
              <div className="space-y-3">
                {[
                  { value: "control-spending", label: "Controlar meus gastos" },
                  { value: "save-money", label: "Conseguir economizar" },
                  { value: "understand-investments", label: "Entender investimentos" },
                  { value: "increase-income", label: "Aumentar minha renda" },
                  { value: "pay-debts", label: "Pagar minhas dívidas" },
                  { value: "organize-finances", label: "Organizar minhas finanças" },
                ].map(option => (
                  <OptionButton
                    key={option.value}
                    selected={formData.biggestFinancialChallenge === option.value}
                    onClick={() => updateField("biggestFinancialChallenge", option.value)}
                  >
                    {option.label}
                  </OptionButton>
                ))}
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  const isLastStep = currentStep === steps.length - 1;
  const progress = ((currentStep + 1) / steps.length) * 100;

  return (
    <div className={`min-h-screen ${theme === "dark" ? "bg-black text-white" : "bg-white text-black"} flex flex-col`}>
      {/* Header */}
      <div className="px-4 pt-6 pb-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-emerald-400" />
            <span className="text-lg font-semibold">Perfil Financeiro</span>
          </div>
          {onSkip && (
            <button
              onClick={onSkip}
              className={`text-sm ${theme === "dark" ? "text-zinc-400" : "text-zinc-600"}`}
            >
              Pular
            </button>
          )}
        </div>

        {/* Progress Bar */}
        <div className={`h-2 rounded-full ${theme === "dark" ? "bg-zinc-800" : "bg-zinc-200"}`}>
          <motion.div
            className="h-full bg-emerald-500 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>

        {/* Step Indicator */}
        <div className="flex items-center justify-between mt-4 overflow-x-auto pb-2">
          {steps.map((step, index) => (
            <div
              key={step.id}
              className={`flex flex-col items-center min-w-[60px] ${
                index <= currentStep
                  ? "text-emerald-400"
                  : theme === "dark"
                  ? "text-zinc-600"
                  : "text-zinc-400"
              }`}
            >
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center mb-1 ${
                  index < currentStep
                    ? "bg-emerald-600"
                    : index === currentStep
                    ? theme === "dark"
                      ? "bg-emerald-600/20 border-2 border-emerald-500"
                      : "bg-emerald-100 border-2 border-emerald-500"
                    : theme === "dark"
                    ? "bg-zinc-800"
                    : "bg-zinc-200"
                }`}
              >
                {index < currentStep ? (
                  <Check className="w-5 h-5 text-white" />
                ) : (
                  step.icon
                )}
              </div>
              <span className="text-xs text-center">{step.title}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 px-4 overflow-y-auto pb-32">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
          >
            <div className="mb-6">
              <h2 className="text-2xl font-bold mb-1">{steps[currentStep].title}</h2>
              <p className={`${theme === "dark" ? "text-zinc-400" : "text-zinc-600"}`}>
                {steps[currentStep].subtitle}
              </p>
            </div>
            {renderStepContent()}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Navigation */}
      <div className={`fixed bottom-0 left-0 right-0 p-4 ${theme === "dark" ? "bg-zinc-900/95" : "bg-white/95"} backdrop-blur-sm border-t ${theme === "dark" ? "border-zinc-800" : "border-zinc-200"}`}>
        <div className="flex gap-3">
          {currentStep > 0 && (
            <button
              onClick={handlePrevious}
              className={`flex-1 py-4 rounded-xl flex items-center justify-center gap-2 ${
                theme === "dark"
                  ? "bg-zinc-800 text-white"
                  : "bg-zinc-100 text-black"
              }`}
            >
              <ChevronLeft className="w-5 h-5" />
              Voltar
            </button>
          )}
          <button
            onClick={isLastStep ? handleSubmit : handleNext}
            disabled={isSubmitting}
            className={`flex-1 py-4 rounded-xl flex items-center justify-center gap-2 bg-emerald-600 text-white ${
              currentStep === 0 ? "w-full" : ""
            }`}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Salvando...
              </>
            ) : isLastStep ? (
              <>
                Concluir
                <Check className="w-5 h-5" />
              </>
            ) : (
              <>
                Próximo
                <ChevronRight className="w-5 h-5" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
