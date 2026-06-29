import * as Icons from "lucide-react";
import { formatPrice } from "@/lib/utils";

interface StatCardProps {
  title: string;
  value: string | number;
  change?: string;
  changeType?: "positive" | "negative" | "neutral";
  icon: string;
  color: "primary" | "accent" | "success" | "warning" | "info" | "destructive";
  delay?: number;
  subtitle?: string;
  subtitleClassName?: string;
  onClick?: () => void;
}

const colorClasses = {
  primary: "bg-purple-50 text-purple-700",
  accent: "bg-purple-50 text-purple-700",
  success: "bg-green-50 text-green-700",
  warning: "bg-amber-50 text-amber-700",
  info: "bg-blue-50 text-blue-700",
  destructive: "bg-red-50 text-red-700",
};

export function StatCard({
  title,
  value,
  change,
  changeType = 'neutral',
  icon,
  color,
  delay = 0,
  subtitle,
  subtitleClassName = "text-gray-600",
  onClick,
}: StatCardProps) {
  const IconComponent = Icons[icon as keyof typeof Icons] as
    | React.ComponentType<{ className?: string }>
    | undefined;

  const changeColors = {
    positive: "text-green-600",
    negative: "text-red-600",
    neutral: "text-gray-500",
  };

  const displayValue =
    typeof value === "string"
      ? value.replace(
        /^\s*LKR\s+([\d,]+(?:\.\d+)?)\s*$/i,
        (_match, amount) => `LKR ${formatPrice(Number(amount.replace(/,/g, "")))}`
      )
      : value;

  return (
    <div
      className={
        [
          "min-w-0 bg-white rounded-2xl shadow-2xs animate-slide-up p-4 sm:p-5 border border-gray-100",
          onClick ? "cursor-pointer transition-all duration-200 hover:shadow-md hover:scale-[1.02] active:scale-[0.99]" : ""
        ].filter(Boolean).join(" ")
      }
      style={{ animationDelay: `${delay}ms` }}
      onClick={onClick}
      tabIndex={onClick ? 0 : undefined}
      role={onClick ? "button" : undefined}
    >
      <div className="mb-2 flex min-w-0 items-start justify-between gap-2 sm:mb-3 sm:gap-3">
        <p className="min-w-0 flex-1 text-sm font-semibold leading-snug text-gray-800 sm:text-base">{title}</p>
        <div className={`shrink-0 rounded-xl border border-gray-100 p-2 shadow-sm sm:p-3 ${colorClasses[color]}`}>
          {IconComponent && <IconComponent className="h-5 w-5 sm:h-6 sm:w-6" />}
        </div>
      </div>
      <p className="break-words text-2xl font-bold text-gray-900 sm:text-3xl">{displayValue}</p>
    </div>
  );
}
