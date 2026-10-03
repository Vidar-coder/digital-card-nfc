import type { Metadata } from "next";
import Link from "next/link";
import { AuthForm } from "@/components/auth/auth-form";
import { DIGITAL_CARD_PROMO_PRICE, getSiteUrl, isBackendConfigured, isRegistrationOpen, MESSENGER_ORDER_URL } from "@/lib/config";
import * as sheets from "@/lib/sheets/api";
import { registerAction } from "../actions";

export const metadata: Metadata = { title: "Create your card" };
export const dynamic = "force-dynamic";

export default async function RegisterPage() {
  const host = getSiteUrl().replace(/^https?:\/\//, "");
  let firstAccount = false;
  if (isBackendConfigured) {
    try {
      firstAccount = (await sheets.listUsers()).count === 0;
    } catch {
      /* backend errors surface when the form is submitted */
    }
  }

  if (!isRegistrationOpen && !firstAccount) {
    return (
      <>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand">Create account</p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-zinc-950">Sign-up is invite-only</h1>
        <p className="mt-2 text-sm leading-relaxed text-zinc-600">
          Accounts are created by an administrator. If you received an invite email, use its link to set your password.
        </p>
        <Link href="/login" className="mt-6 inline-block text-sm font-medium text-brand hover:underline">
          ← Back to sign in
        </Link>
      </>
    );
  }

  return (
    <>
      {firstAccount && (
        <div className="mb-6 rounded-xl border border-indigo-200 bg-indigo-50 p-4 text-sm text-indigo-900">
          <strong>First account:</strong> you&apos;ll be the <strong>admin</strong> — able to add and manage other users, each with their own
          card and dashboard.
        </div>
      )}
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand">Get started</p>
      <h1 className="mt-2 text-2xl font-semibold tracking-tight text-zinc-950 sm:text-3xl">Create your account</h1>
      <p className="mb-8 mt-2 text-sm leading-relaxed text-zinc-600">
        Build your digital business card profile in minutes. Ordered NFC with us? Use the email we confirmed—then customize
        everything in your dashboard.
      </p>
      <AuthForm
        action={registerAction}
        submitLabel="Create account"
        fields={[
          { name: "full_name", label: "Full name", autoComplete: "name", placeholder: "Rolando S. Valle" },
          {
            name: "username",
            label: "Username",
            autoComplete: "username",
            placeholder: "yourname",
            hint: `Your public card: ${host}/p/yourname`,
          },
          { name: "email", label: "Email", type: "email", autoComplete: "email", placeholder: "you@company.com" },
          {
            name: "password",
            label: "Password",
            type: "password",
            autoComplete: "new-password",
            hint: "At least 8 characters with a letter and a number",
          },
        ]}
        footer={
          <div className="space-y-4 pt-1">
            <p className="text-center text-sm text-zinc-600">
              Already have an account?{" "}
              <Link href="/login" className="font-medium text-brand hover:underline">
                Sign in
              </Link>
            </p>
            <p className="rounded-xl border border-indigo-100 bg-indigo-50/60 px-3 py-2.5 text-center text-xs leading-relaxed text-zinc-700">
              Need the physical NFC card? Promo {DIGITAL_CARD_PROMO_PRICE} —{" "}
              <a href={MESSENGER_ORDER_URL} target="_blank" rel="noopener noreferrer" className="font-medium text-brand hover:underline">
                message us now
              </a>
            </p>
          </div>
        }
      />
    </>
  );
}
