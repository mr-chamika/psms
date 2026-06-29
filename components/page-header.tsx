import type { ComponentType } from "react";

const DEFAULT_SUBTITLE = "PhotoStudio Management System";

type PageHeaderIcon = ComponentType<{ className?: string; "aria-hidden"?: boolean }>;

type PageHeaderProps = {
  title: string;
  icon: PageHeaderIcon;
  subtitle?: string;
};

export default function PageHeader({ title, icon: Icon, subtitle = DEFAULT_SUBTITLE }: PageHeaderProps) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#1D3658]">
        <Icon className="h-5 w-5 text-white" aria-hidden />
      </div>
      <div>
        <h1 className="text-lg font-bold text-gray-900">{title}</h1>
        <p className="text-xs text-gray-500">{subtitle}</p>
      </div>
    </div>
  );
}
