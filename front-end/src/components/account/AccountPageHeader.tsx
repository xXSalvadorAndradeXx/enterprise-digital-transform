import type { ReactNode } from "react";

interface AccountPageHeaderProps {
  title: string;
  description: string;
  action?: ReactNode;
}

export default function AccountPageHeader({
  title,
  description,
  action,
}: AccountPageHeaderProps) {
  return (
    <header className="mb-8 flex min-h-[96px] flex-col gap-4 border-b border-stone-200 pb-5 sm:flex-row sm:items-start sm:justify-between">
      <div className="min-w-0">
        <h1 className="text-2xl font-bold tracking-tight text-stone-900 sm:text-3xl">
          {title}
        </h1>
        <p className="mt-1.5 max-w-2xl text-sm leading-6 text-stone-500 sm:text-base">
          {description}
        </p>
      </div>
      {action ? <div className="shrink-0 sm:pt-1">{action}</div> : null}
    </header>
  );
}
