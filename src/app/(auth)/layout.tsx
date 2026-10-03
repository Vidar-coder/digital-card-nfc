import Link from "next/link";
import { BrandMark } from "@/components/brand-mark";
import { isBackendConfigured, SITE_NAME } from "@/lib/config";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-dvh lg:grid-cols-[1fr_1.1fr]">
      <div className="flex flex-col px-6 py-8 sm:px-12">
        <Link href="/" className="flex items-center gap-2.5">
          <BrandMark size={30} />
          <span className="font-semibold tracking-tight">{SITE_NAME}</span>
        </Link>
        <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center py-12">
          {!isBackendConfigured && (
            <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
              <p className="font-semibold">Database not connected</p>
              <p className="mt-1">
                Sign-in needs the Google Apps Script backend.{" "}
                <Link href="/setup" className="font-semibold underline">
                  Follow the setup guide →
                </Link>
              </p>
            </div>
          )}
          {children}
        </div>
        <p className="text-xs text-zinc-400">© {new Date().getFullYear()} {SITE_NAME}</p>
      </div>

      <div className="relative hidden overflow-hidden bg-zinc-950 lg:block">
        <div className="absolute -left-20 top-10 size-[480px] rounded-full bg-indigo-600/40 blur-3xl" />
        <div className="absolute -bottom-24 right-0 size-[420px] rounded-full bg-violet-600/30 blur-3xl" />
        <div className="relative flex h-full flex-col justify-end p-14 text-white">
          <div className="mb-10 w-80 rotate-[-4deg] rounded-3xl border border-white/15 bg-white/10 p-6 shadow-2xl backdrop-blur-xl">
            <div className="flex items-center gap-3">
              <div className="size-12 rounded-full bg-gradient-to-br from-indigo-400 to-violet-500" />
              <div>
                <div className="h-3 w-28 rounded bg-white/80" />
                <div className="mt-2 h-2.5 w-20 rounded bg-white/40" />
              </div>
            </div>
            <div className="mt-6 h-10 rounded-xl bg-white text-center text-sm font-semibold leading-10 text-zinc-900">
              Save Contact
            </div>
            <div className="mt-2 grid grid-cols-3 gap-2">
              {[0, 1, 2].map((i) => (
                <div key={i} className="h-10 rounded-xl bg-white/15" />
              ))}
            </div>
          </div>
          <h2 className="max-w-md text-3xl font-semibold leading-tight tracking-tight">
            One tap. Your whole professional story.
          </h2>
          <p className="mt-3 max-w-md text-zinc-400">
            Program your NFC card once, then update your profile, portfolio and design anytime — no reprinting.
          </p>
        </div>
      </div>
    </div>
  );
}
