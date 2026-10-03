import Link from "next/link";
import { AuthPromoPanel } from "@/components/auth/auth-promo-panel";
import { BrandMark } from "@/components/brand-mark";
import { isBackendConfigured, SITE_NAME } from "@/lib/config";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh bg-white lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)]">
      <div className="flex flex-col px-6 py-8 sm:px-10 lg:px-12">
        <Link href="/" className="flex items-center gap-2.5">
          <BrandMark size={30} />
          <span className="font-semibold tracking-tight text-zinc-950">{SITE_NAME}</span>
        </Link>

        <div className="mx-auto w-full max-w-md flex-1 py-8 lg:hidden">
          <AuthPromoPanel compact />
        </div>

        <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center pb-8 lg:py-12">
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

        <p className="pb-6 text-center text-xs text-zinc-400 lg:text-left">
          © {new Date().getFullYear()} {SITE_NAME}
        </p>
      </div>

      <div className="relative hidden overflow-hidden border-l border-zinc-100 bg-zinc-50/50 lg:block">
        <div
          className="pointer-events-none absolute inset-x-0 top-0 mx-auto h-[420px] max-w-lg rounded-full bg-gradient-to-br from-indigo-200/70 via-violet-200/50 to-sky-200/40 blur-3xl"
          aria-hidden
        />
        <div className="relative flex h-full min-h-dvh items-center justify-center">
          <AuthPromoPanel />
        </div>
      </div>
    </div>
  );
}
