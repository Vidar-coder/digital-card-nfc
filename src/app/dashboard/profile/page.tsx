import { PageHeader } from "@/components/dashboard/page-header";
import { ProfileEditor } from "@/components/dashboard/profile-editor";

export default function ProfilePage() {
  return (
    <>
      <PageHeader title="Profile" description="Your photo, name, headline and card URL." />
      <ProfileEditor />
    </>
  );
}
