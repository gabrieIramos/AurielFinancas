import { useState } from "react";
import { motion, AnimatePresence, useMotionValue, useTransform, PanInfo } from "motion/react";
import { ChevronRight } from "lucide-react";
import { useTheme } from "../contexts/ThemeContext";

type OnboardingStep = {
  emoji: string;
  title: string;
  description: string;
  backgroundImage: string;
};

const onboardingSteps: OnboardingStep[] = [
  {
    emoji: "💰",
    title: "Controle total da sua vida financeira",
    description: "Centralize contas, cartões e investimentos em um único lugar e acompanhe sua evolução financeira.",
    backgroundImage: "https://images.unsplash.com/photo-1726056652605-c4cf751ec0df?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxmaW5hbmNpYWwlMjBtYW5hZ2VtZW50JTIwbW9iaWxlfGVufDF8fHx8MTc2ODU2Nzc3N3ww&ixlib=rb-4.1.0&q=80&w=1080",
  },
  {
    emoji: "⚡",
    title: "Menos esforço, mais controle",
    description: "Importe extratos via arquivos OFX e deixe a automação organizar tudo para você.",
    backgroundImage: "https://images.unsplash.com/photo-1761195696590-3490ea770aa1?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhdXRvbWF0aW9uJTIwdGVjaG5vbG9neXxlbnwxfHx8fDE3Njg1MDA1NTd8MA&ixlib=rb-4.1.0&q=80&w=1080",
  },
  {
    emoji: "🤖",
    title: "Inteligência que entende seus gastos",
    description: "Descrições confusas viram categorias claras com ajuda de IA e aprendizado contínuo.",
    backgroundImage: "https://images.unsplash.com/photo-1674027444485-cec3da58eef4?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhcnRpZmljaWFsJTIwaW50ZWxsaWdlbmNlJTIwYnJhaW58ZW58MXx8fHwxNzY4NDcxNjQzfDA&ixlib=rb-4.1.0&q=80&w=1080",
  },
  {
    emoji: "📈",
    title: "Seu patrimônio em foco",
    description: "Visualize seu patrimônio líquido com clareza e visão de longo prazo.",
    backgroundImage: "https://images.unsplash.com/photo-1717147727046-0db3701ed4ea?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx3ZWFsdGglMjBncm93dGglMjBjaGFydHxlbnwxfHx8fDE3Njg1Njc3Nzh8MA&ixlib=rb-4.1.0&q=80&w=1080",
  },
  {
    emoji: "📊",
    title: "Investimentos sob controle",
    description: "Acompanhe ações, FIIs e renda fixa com dados atualizados e análise inteligente.",
    backgroundImage: "https://images.unsplash.com/photo-1631649387042-f60a0133d3ca?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzdG9jayUyMG1hcmtldCUyMGludmVzdG1lbnR8ZW58MXx8fHwxNzY4NDkyOTQ1fDA&ixlib=rb-4.1.0&q=80&w=1080",
  },
  {
    emoji: "✨",
    title: "Comece a construir sua liberdade financeira",
    description: "Tudo o que você precisa para organizar, entender e evoluir sua vida financeira, em um só lugar.",
    backgroundImage: "https://images.unsplash.com/photo-1596313398625-2c16b75031b3?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxmaW5hbmNpYWwlMjBmcmVlZG9tJTIwc3VjY2Vzc3xlbnwxfHx8fDE3Njg1Njc3Nzl8MA&ixlib=rb-4.1.0&q=80&w=1080",
  },
];

type OnboardingScreenProps = {
  onComplete: () => void;
  onSignup: () => void;
  onLogin: () => void;
};

export default function OnboardingScreen({ onComplete, onSignup, onLogin }: OnboardingScreenProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const { theme } = useTheme();
  const x = useMotionValue(0);
  const opacity = useTransform(x, [-200, 0, 200], [0.5, 1, 0.5]);

  const handleDragEnd = (event: any, info: PanInfo) => {
    const threshold = 100;
    
    if (info.offset.x < -threshold && currentStep < onboardingSteps.length - 1) {
      setCurrentStep((prev) => prev + 1);
    } else if (info.offset.x > threshold && currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const handleSkip = () => {
    setCurrentStep(onboardingSteps.length - 1);
  };

  const handleNext = () => {
    if (currentStep < onboardingSteps.length - 1) {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const isLastStep = currentStep === onboardingSteps.length - 1;

  return (
    <div className={`min-h-screen ${theme === "dark" ? "bg-black" : "bg-white"} flex flex-col overflow-hidden relative`}>
      {/* Background Image with Overlay */}
      <motion.div
        key={`bg-${currentStep}`}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.5 }}
        className="absolute inset-0 z-0"
      >
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${onboardingSteps[currentStep].backgroundImage})` }}
        />
        <div className={`absolute inset-0 ${theme === "dark" ? "bg-black/70" : "bg-white/70"} backdrop-blur-sm`} />
      </motion.div>

      <div className="mx-auto w-full max-w-[430px] min-h-screen flex flex-col relative z-10">
        {/* Skip Button */}
        {!isLastStep && (
          <div className="pt-6 px-6 flex justify-end">
            <button
              onClick={handleSkip}
              className={`${
                theme === "dark" ? "text-zinc-500 hover:text-zinc-300" : "text-zinc-400 hover:text-zinc-600"
              } transition-colors`}
            >
              Pular
            </button>
          </div>
        )}

        {/* Content Area */}
        <div className="flex-1 flex flex-col justify-center px-6 py-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 100 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -100 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              drag={!isLastStep ? "x" : false}
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.2}
              onDragEnd={handleDragEnd}
              style={{ x, opacity }}
              className="text-center"
            >
              {/* Emoji */}
              <div className="mb-8">
                <span className="text-7xl">{onboardingSteps[currentStep].emoji}</span>
              </div>

              {/* Title */}
              <h1 className={`text-3xl mb-6 px-4 ${theme === "dark" ? "text-white" : "text-black"}`}>
                {onboardingSteps[currentStep].title}
              </h1>

              {/* Description */}
              <p
                className={`text-lg leading-relaxed px-6 ${
                  theme === "dark" ? "text-zinc-400" : "text-zinc-600"
                }`}
              >
                {onboardingSteps[currentStep].description}
              </p>

              {/* Last Step Actions */}
              {isLastStep && (
                <div className="mt-12 space-y-4 px-4">
                  <button
                    onClick={onSignup}
                    className="w-full bg-emerald-600 text-white py-4 rounded-2xl hover:bg-emerald-700 transition-all transform active:scale-95"
                  >
                    Quero começar agora
                  </button>
                  <button
                    onClick={onLogin}
                    className={`w-full ${
                      theme === "dark"
                        ? "bg-zinc-900 text-white hover:bg-zinc-800"
                        : "bg-zinc-100 text-black hover:bg-zinc-200"
                    } py-4 rounded-2xl transition-all transform active:scale-95`}
                  >
                    Já faço parte, entrar
                  </button>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Bottom Section */}
        <div className="pb-8 px-6">
          {/* Progress Dots */}
          <div className="flex items-center justify-center gap-2 mb-6">
            {onboardingSteps.map((_, index) => (
              <motion.div
                key={index}
                className={`h-2 rounded-full transition-all ${
                  index === currentStep
                    ? "w-8 bg-emerald-500"
                    : theme === "dark"
                    ? "w-2 bg-zinc-700"
                    : "w-2 bg-zinc-300"
                }`}
                layout
              />
            ))}
          </div>

          {/* Next Arrow */}
          {!isLastStep && (
            <div className="flex justify-end">
              <motion.button
                onClick={handleNext}
                className="p-4 bg-emerald-600 rounded-full text-white shadow-lg"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                animate={{
                  x: [0, 5, 0],
                }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              >
                <ChevronRight className="w-6 h-6" />
              </motion.button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}