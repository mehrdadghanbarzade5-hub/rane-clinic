import PanelShell from "@/components/panel/PanelShell";
import ClientExperienceProvider from "@/components/panel/settings/ClientExperienceProvider";

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  return (
    <PanelShell role="client">
      <ClientExperienceProvider />
      {children}
    </PanelShell>
  );
}