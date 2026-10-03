import { PageHeader } from "@/components/dashboard/page-header";
import { ThemeCustomizer } from "@/components/dashboard/theme-customizer";

export default function AppearancePage() {
  return (
    <>
      <PageHeader title="Appearance" description="Brand your card. Every change shows instantly in the live preview." />
      <ThemeCustomizer />
    </>
  );
}
