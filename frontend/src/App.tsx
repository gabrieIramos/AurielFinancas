import { useState } from "react";
import { Home, FileText, PieChart, Brain, User } from "lucide-react";
import { ThemeProvider, useTheme } from "./contexts/ThemeContext";
import HomeScreen from "./components/HomeScreen";
import ExtratoScreen from "./components/ExtratoScreen";
import CarteiraScreen from "./components/CarteiraScreen";
import IAScreen from "./components/IAScreen";
import PerfilScreen from "./components/PerfilScreen";

type Tab = "home" | "extrato" | "carteira" | "ia" | "perfil";

function AppContent() {
  const [activeTab, setActiveTab] = useState<Tab>("home");
  const { theme } = useTheme();

  const tabs = [
    { id: "home" as Tab, icon: Home, label: "Home" },
    { id: "extrato" as Tab, icon: FileText, label: "Extrato" },
    { id: "carteira" as Tab, icon: PieChart, label: "Carteira" },
    { id: "ia" as Tab, icon: Brain, label: "IA" },
    { id: "perfil" as Tab, icon: User, label: "Perfil" },
  ];

  const renderScreen = () => {
    switch (activeTab) {
      case "home":
        return <HomeScreen />;
      case "extrato":
        return <ExtratoScreen />;
      case "carteira":
        return <CarteiraScreen />;
      case "ia":
        return <IAScreen />;
      case "perfil":
        return <PerfilScreen />;
      default:
        return <HomeScreen />;
    }
  };

  return (
    <div className={theme === "dark" ? "dark" : ""}>
      <div className={`min-h-screen ${theme === "dark" ? "bg-black" : "bg-white"}`}>
        <div className={`mx-auto max-w-[430px] min-h-screen ${theme === "dark" ? "bg-black" : "bg-white"} flex flex-col`}>
          {/* Main Content */}
          <div className="flex-1 overflow-auto pb-20">
            {renderScreen()}
          </div>

          {/* Bottom Tab Bar */}
          <div className={`fixed bottom-0 left-0 right-0 mx-auto max-w-[430px] ${
            theme === "dark" ? "bg-zinc-900 border-zinc-800" : "bg-white border-zinc-200"
          } border-t`}>
            <div className="flex items-center justify-around px-2 py-3">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex flex-col items-center gap-1 px-4 py-1 transition-colors ${
                      isActive 
                        ? "text-emerald-500" 
                        : theme === "dark" ? "text-zinc-500" : "text-zinc-400"
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="text-xs">{tab.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
}