import { PageHeader } from "@/components/dashboard/page-header";
import { SharePanel } from "@/components/dashboard/share-panel";

export default function SharePage() {
  return (
    <>
      <PageHeader title="QR code & sharing" description="Everything you need to put your card into the world." />
      <SharePanel />
    </>
  );
}
