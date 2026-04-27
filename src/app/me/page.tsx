import { AppShell } from "@/components/app-shell";
import { MeScreen } from "@/components/me-screen";

export default function MePage() {
  return (
    <AppShell activeTab="me">
      <MeScreen />
    </AppShell>
  );
}
