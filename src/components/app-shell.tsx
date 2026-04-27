import type { ReactNode } from "react";

import { BottomNav } from "@/components/bottom-nav";

type AppShellProps = {
  children: ReactNode;
  activeTab: "home" | "words" | "review" | "me";
};

export function AppShell({ children, activeTab }: AppShellProps) {
  return (
    <div className="mx-auto flex min-h-screen w-full max-w-[430px] flex-col rounded-[30px] bg-[var(--surface)] shadow-[0_18px_48px_rgba(77,52,27,0.12)]">
      <main className="flex-1 pb-28">{children}</main>
      <BottomNav activeTab={activeTab} />
    </div>
  );
}
