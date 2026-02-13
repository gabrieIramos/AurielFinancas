import { useTheme } from "../contexts/ThemeContext";

interface LoadingProps {
  size?: "sm" | "md" | "lg";
  color?: "emerald" | "purple" | "white" | "text";
  fullScreen?: boolean;
  message?: string;
  inline?: boolean; // Para usar dentro de botões
}

export default function Loading({ 
  size = "md", 
  color = "emerald", 
  fullScreen = false,
  message,
  inline = false
}: LoadingProps) {
  const { theme } = useTheme();

  const sizeMap = {
    sm: "16px",
    md: "24px",
    lg: "64px"
  };

  const borderWidthMap = {
    sm: "2px",
    md: "3px",
    lg: "4px"
  };

  const getColor = () => {
    switch (color) {
      case "emerald":
        return "#10b981";
      case "purple":
        return "#a855f7";
      case "white":
        return "#ffffff";
      case "text":
        return theme === "dark" ? "#ffffff" : "#000000";
      default:
        return "#10b981";
    }
  };

  const spinnerStyle = {
    width: sizeMap[size],
    height: sizeMap[size],
    border: `${borderWidthMap[size]} solid rgba(200, 200, 200, 0.2)`,
    borderTopColor: getColor(),
    borderRadius: "50%",
    animation: "spin-animation 1s linear infinite"
  };

  const spinner = (
    <>
      <style>{`
        @keyframes spin-animation {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
      {inline ? (
        <div style={spinnerStyle as any} />
      ) : (
        <div className="flex flex-col items-center gap-3">
          <div style={spinnerStyle as any} />
          {message && (
            <p className={`text-sm ${theme === "dark" ? "text-zinc-400" : "text-zinc-600"}`}>
              {message}
            </p>
          )}
        </div>
      )}
    </>
  );

  if (fullScreen) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${
        theme === "dark" ? "bg-black" : "bg-white"
      }`}>
        {spinner}
      </div>
    );
  }

  return spinner;
}
