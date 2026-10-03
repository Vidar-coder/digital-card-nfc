import Link from "next/link";
import { BrandMark } from "@/components/brand-mark";

export default function ProfileNotFound() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center px-6 text-center">
      <BrandMark size={48} />
      <h1 className="mt-6 text-2xl font-semibold tracking-tight">This card isn&apos;t active</h1>
      <p className="mt-2 max-w-sm text-zinc-600">
        The profile you&apos;re looking for doesn&apos;t exist or hasn&apos;t been published yet. Double-check the link or
        ask the owner to share it again.
      </p>
      <Link href="/" className="mt-6 rounded-xl bg-zinc-900 px-5 py-3 text-sm font-semibold text-white hover:bg-zinc-800">
        Create your own card
      </Link>
    </main>
  );
}
