import type { Metadata } from "next";
import Link from "next/link";
import { AuthForm } from "@/components/auth/auth-form";
import { MESSENGER_ORDER_URL } from "@/lib/config";
import { loginAction } from "../actions";

export const metadata: Metadata = { title: "Sign in" };

export default async function LoginPage(props: PageProps<"/login">) {
  const { next, error } = await props.searchParams;
  return (
    <>
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand">Sign in</p>
      <h1 className="mt-2 text-2xl font-semibold tracking-tight text-zinc-950 sm:text-3xl">Welcome back</h1>
      <p className="mb-8 mt-2 text-sm leading-relaxed text-zinc-600">
        Access your dashboard to edit your profile, download your QR, and see how people engage with your card.
      </p>
      {error === "link" && (
        <p className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">That link is invalid or has expired.</p>
      )}
      <AuthForm
        action={loginAction}
        submitLabel="Sign in"
        hidden={{ next: typeof next === "string" ? next : "/dashboard" }}
        fields={[
          { name: "email", label: "Email", type: "email", autoComplete: "email", placeholder: "you@company.com" },
          { name: "password", label: "Password", type: "password", autoComplete: "current-password" },
        ]}
        footer={
          <div className="space-y-4 pt-1">
            <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
              <Link href="/forgot-password" className="text-zinc-600 hover:text-zinc-900">
                Forgot password?
              </Link>
              <Link href="/register" className="font-medium text-brand hover:underline">
                Create account
              </Link>
            </div>
            <p className="rounded-xl border border-zinc-100 bg-zinc-50 px-3 py-2.5 text-center text-xs leading-relaxed text-zinc-600">
              Don&apos;t have a card yet?{" "}
              <a href={MESSENGER_ORDER_URL} target="_blank" rel="noopener noreferrer" className="font-medium text-zinc-900 hover:underline">
                Message us
              </a>{" "}
              to order your digital NFC card.
            </p>
          </div>
        }
      />
    </>
  );
}
