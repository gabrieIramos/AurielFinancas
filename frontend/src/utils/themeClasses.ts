// Utility classes para suporte a light/dark mode

export const themeClasses = {
  // Backgrounds
  bg: {
    primary: (theme: string | undefined) => theme === "dark" ? "bg-black" : "bg-white",
    secondary: (theme: string | undefined) => theme === "dark" ? "bg-zinc-900" : "bg-gray-100",
    tertiary: (theme: string | undefined) => theme === "dark" ? "bg-zinc-800" : "bg-gray-200",
    hover: (theme: string | undefined) => theme === "dark" ? "hover:bg-zinc-800" : "hover:bg-gray-200",
  },

  // Text
  text: {
    primary: (theme: string | undefined) => theme === "dark" ? "text-white" : "text-black",
    secondary: (theme: string | undefined) => theme === "dark" ? "text-zinc-400" : "text-gray-600",
    tertiary: (theme: string | undefined) => theme === "dark" ? "text-zinc-300" : "text-gray-700",
  },

  // Borders
  border: {
    primary: (theme: string | undefined) => theme === "dark" ? "border-zinc-800" : "border-gray-300",
    secondary: (theme: string | undefined) => theme === "dark" ? "border-zinc-700" : "border-gray-200",
  },

  // Cards
  card: (theme: string | undefined) =>
    theme === "dark"
      ? "bg-zinc-900"
      : "bg-gray-100 border border-gray-300",

  // Input
  input: (theme: string | undefined) =>
    theme === "dark"
      ? "bg-zinc-800 border-zinc-700 text-white"
      : "bg-gray-50 border-gray-300 text-black",

  // Button
  buttonSecondary: (theme: string | undefined) =>
    theme === "dark"
      ? "bg-zinc-900 text-zinc-400 hover:bg-zinc-800"
      : "bg-gray-200 text-gray-600 hover:bg-gray-300",

  // Tooltip
  tooltip: (theme: string | undefined) => ({
    backgroundColor: theme === "dark" ? "#27272a" : "#f3f4f6",
    border: `1px solid ${theme === "dark" ? "#52525b" : "#d1d5db"}`,
    color: theme === "dark" ? "#ffffff" : "#000000",
  }),
};
