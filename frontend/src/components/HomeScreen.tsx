import { Eye, EyeOff, TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { useState } from "react";
import { LineChart, Line, PieChart, Pie, Cell, BarChart, Bar, ResponsiveContainer, XAxis, YAxis, Tooltip } from "recharts";
import { useTheme } from "../contexts/ThemeContext";

// Mock Data
const patrimonioData = [
  { month: "Jan", value: 125000 },
  { month: "Fev", value: 132000 },
  { month: "Mar", value: 128000 },
  { month: "Abr", value: 145000 },
  { month: "Mai", value: 158000 },
  { month: "Jun", value: 165000 },
];

const alocacaoData = [
  { name: "Ações", value: 65000, color: "#10b981" },
  { name: "FIIs", value: 45000, color: "#3b82f6" },
  { name: "Renda Fixa", value: 35000, color: "#8b5cf6" },
  { name: "Criptomoedas", value: 20000, color: "#f59e0b" },
];

const despesasPorCategoria = [
  { categoria: "Alimentação", valor: 2850.50, cor: "#f59e0b" },
  { categoria: "Transporte", valor: 1420.30, cor: "#3b82f6" },
  { categoria: "Saúde", valor: 985.60, cor: "#10b981" },
  { categoria: "Lazer", valor: 1650.00, cor: "#8b5cf6" },
  { categoria: "Assinaturas", valor: 425.40, cor: "#ef4444" },
  { categoria: "Educação", valor: 1014.00, cor: "#06b6d4" },
];

const totalGastos = despesasPorCategoria.reduce((acc, item) => acc + item.valor, 0);

const resumoMensal = {
  receitas: 15420.50,
  gastos: totalGastos,
  investimentos: 5000.00,
};

export default function HomeScreen() {
  const [showValues, setShowValues] = useState(true);
  const { theme } = useTheme();

  const patrimonioTotal = 165000;
  const variacaoMes = 4.5;
  const saldoLiquido = resumoMensal.receitas - resumoMensal.gastos;

  const formatCurrency = (value: number) => {
    if (!showValues) return "R$ •••••";
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  return (
    <div className={`min-h-screen ${theme === "dark" ? "bg-black text-white" : "bg-white text-black"} pb-4`}>
      {/* Header */}
      <div className="px-4 pt-6 pb-4">
        <div className="flex items-center justify-between mb-6">
          <div>
            <p className={`${theme === "dark" ? "text-zinc-400" : "text-zinc-600"} text-sm`}>Bem-vindo de volta,</p>
            <h1 className="text-2xl">Rafael Silva</h1>
          </div>
          <button
            onClick={() => setShowValues(!showValues)}
            className={`p-2 ${theme === "dark" ? "bg-zinc-900 hover:bg-zinc-800" : "bg-zinc-100 hover:bg-zinc-200"} rounded-full transition-colors`}
          >
            {showValues ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
          </button>
        </div>

        {/* Patrimônio Total Card */}
        <div className="bg-gradient-to-br from-emerald-600 to-emerald-800 rounded-2xl p-6 mb-4">
          <p className="text-emerald-100 text-sm mb-2">Patrimônio Total</p>
          <h2 className="text-3xl mb-3 text-white">{formatCurrency(patrimonioTotal)}</h2>
          <div className="flex items-center gap-2">
            {variacaoMes >= 0 ? (
              <TrendingUp className="w-4 h-4 text-emerald-200" />
            ) : (
              <TrendingDown className="w-4 h-4 text-red-300" />
            )}
            <span className={`text-sm ${variacaoMes >= 0 ? "text-emerald-200" : "text-red-300"}`}>
              {variacaoMes >= 0 ? "+" : ""}{variacaoMes}% no mês
            </span>
          </div>
        </div>

        {/* Resumo Mensal */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className={`${theme === "dark" ? "bg-zinc-900" : "bg-zinc-50"} rounded-xl p-4`}>
            <div className="flex items-center gap-1 mb-2">
              <ArrowUpRight className="w-4 h-4 text-emerald-400" />
              <p className={`text-xs ${theme === "dark" ? "text-zinc-400" : "text-zinc-600"}`}>Receitas</p>
            </div>
            <p className="text-sm">{formatCurrency(resumoMensal.receitas)}</p>
          </div>
          <div className={`${theme === "dark" ? "bg-zinc-900" : "bg-zinc-50"} rounded-xl p-4`}>
            <div className="flex items-center gap-1 mb-2">
              <ArrowDownRight className="w-4 h-4 text-red-400" />
              <p className={`text-xs ${theme === "dark" ? "text-zinc-400" : "text-zinc-600"}`}>Gastos</p>
            </div>
            <p className="text-sm">{formatCurrency(resumoMensal.gastos)}</p>
          </div>
          <div className={`${theme === "dark" ? "bg-zinc-900" : "bg-zinc-50"} rounded-xl p-4`}>
            <div className="flex items-center gap-1 mb-2">
              <TrendingUp className="w-4 h-4 text-blue-400" />
              <p className={`text-xs ${theme === "dark" ? "text-zinc-400" : "text-zinc-600"}`}>Investido</p>
            </div>
            <p className="text-sm">{formatCurrency(resumoMensal.investimentos)}</p>
          </div>
        </div>

        {/* Saldo do Mês */}
        <div className={`${theme === "dark" ? "bg-zinc-900" : "bg-zinc-50"} rounded-xl p-4 mb-6`}>
          <p className={`${theme === "dark" ? "text-zinc-400" : "text-zinc-600"} text-sm mb-2`}>Saldo Líquido do Mês</p>
          <p className={`text-2xl ${saldoLiquido >= 0 ? "text-emerald-400" : "text-red-400"}`}>
            {formatCurrency(saldoLiquido)}
          </p>
        </div>
      </div>

      {/* Evolução Patrimonial */}
      <div className="px-4 mb-6">
        <h3 className="mb-4">Evolução Patrimonial</h3>
        <div className={`${theme === "dark" ? "bg-zinc-900" : "bg-zinc-50"} rounded-xl p-4`}>
          {showValues ? (
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={patrimonioData}>
                <XAxis
                  dataKey="month"
                  stroke={theme === "dark" ? "#71717a" : "#a1a1aa"}
                  tick={{ fill: theme === "dark" ? "#71717a" : "#a1a1aa", fontSize: 12 }}
                />
                <YAxis
                  stroke={theme === "dark" ? "#71717a" : "#a1a1aa"}
                  tick={{ fill: theme === "dark" ? "#71717a" : "#a1a1aa", fontSize: 12 }}
                  tickFormatter={(value) => `${value / 1000}k`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: theme === "dark" ? "#18181b" : "#ffffff",
                    border: `1px solid ${theme === "dark" ? "#3f3f46" : "#e4e4e7"}`,
                    borderRadius: "8px",
                    color: theme === "dark" ? "#ffffff" : "#000000",
                  }}
                  formatter={(value: number) => formatCurrency(value)}
                />
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke="#10b981"
                  strokeWidth={2}
                  dot={{ fill: "#10b981", r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className={`h-[200px] flex items-center justify-center ${theme === "dark" ? "text-zinc-500" : "text-zinc-400"}`}>
              <div className="text-center">
                <EyeOff className="w-8 h-8 mx-auto mb-2" />
                <p className="text-sm">Valores ocultos</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Despesas por Categoria */}
      <div className="px-4 mb-6">
        <h3 className="mb-4">Despesas por Categoria</h3>
        <div className={`${theme === "dark" ? "bg-zinc-900" : "bg-zinc-50"} rounded-xl p-4`}>
          {showValues ? (
            <>
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={despesasPorCategoria} margin={{ top: 5, right: 5, left: -10, bottom: 5 }}>
                  <XAxis
                    dataKey="categoria"
                    stroke={theme === "dark" ? "#71717a" : "#a1a1aa"}
                    tick={{ fill: theme === "dark" ? "#71717a" : "#a1a1aa", fontSize: 10 }}
                    angle={-45}
                    textAnchor="end"
                    height={70}
                  />
                  <YAxis
                    stroke={theme === "dark" ? "#71717a" : "#a1a1aa"}
                    tick={{ fill: theme === "dark" ? "#71717a" : "#a1a1aa", fontSize: 11 }}
                    tickFormatter={(value) => `${(value / 1000).toFixed(1)}k`}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: theme === "dark" ? "#18181b" : "#ffffff",
                      border: `1px solid ${theme === "dark" ? "#3f3f46" : "#e4e4e7"}`,
                      borderRadius: "8px",
                      color: theme === "dark" ? "#ffffff" : "#000000",
                    }}
                    formatter={(value: number) => formatCurrency(value)}
                  />
                  <Bar
                    dataKey="valor"
                    fill="#10b981"
                    radius={[8, 8, 0, 0]}
                  >
                    {despesasPorCategoria.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.cor} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
              <div className="mt-6 space-y-2">
                {despesasPorCategoria
                  .sort((a, b) => b.valor - a.valor)
                  .map((item, index) => {
                    const percentage = ((item.valor / resumoMensal.gastos) * 100).toFixed(1);
                    return (
                      <div key={index} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: item.cor }}
                          />
                          <span className={`text-sm ${theme === "dark" ? "text-zinc-300" : "text-zinc-700"}`}>{item.categoria}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className={`text-sm ${theme === "dark" ? "text-zinc-400" : "text-zinc-500"}`}>{percentage}%</span>
                          <span className="text-sm">{formatCurrency(item.valor)}</span>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </>
          ) : (
            <div className={`h-[240px] flex items-center justify-center ${theme === "dark" ? "text-zinc-500" : "text-zinc-400"}`}>
              <div className="text-center">
                <EyeOff className="w-8 h-8 mx-auto mb-2" />
                <p className="text-sm">Valores ocultos</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Alocação de Ativos */}
      <div className="px-4">
        <h3 className="mb-4">Alocação de Ativos</h3>
        <div className={`${theme === "dark" ? "bg-zinc-900" : "bg-zinc-50"} rounded-xl p-4`}>
          {showValues ? (
            <>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={alocacaoData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {alocacaoData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: theme === "dark" ? "#18181b" : "#ffffff",
                      border: `1px solid ${theme === "dark" ? "#3f3f46" : "#e4e4e7"}`,
                      borderRadius: "8px",
                      color: theme === "dark" ? "#ffffff" : "#000000",
                    }}
                    formatter={(value: number) => formatCurrency(value)}                   
                    itemStyle={{
                      color: theme === "dark" ? "#e5e7eb" : "#111827",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="mt-4 space-y-2">
                {alocacaoData.map((item, index) => {
                  const percentage = ((item.value / patrimonioTotal) * 100).toFixed(1);
                  return (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: item.color }}
                        />
                        <span className={`text-sm ${theme === "dark" ? "text-zinc-300" : "text-zinc-700"}`}>{item.name}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={`text-sm ${theme === "dark" ? "text-zinc-400" : "text-zinc-500"}`}>{percentage}%</span>
                        <span className="text-sm">{formatCurrency(item.value)}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          ) : (
            <div className={`h-[200px] flex items-center justify-center ${theme === "dark" ? "text-zinc-500" : "text-zinc-400"}`}>
              <div className="text-center">
                <EyeOff className="w-8 h-8 mx-auto mb-2" />
                <p className="text-sm">Valores ocultos</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}