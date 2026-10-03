import type { Metadata } from "next";
import Link from "next/link";
import { AuthForm } from "@/components/auth/auth-form";
import { getSiteUrl, isBackendConfigured, isRegistrationOpen } from "@/lib/config";
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
        <h1 className="text-2xl font-semibold tracking-tight">Sign-up is invite-only</h1>
        <p className="mt-2 text-sm text-zinc-600">
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
      <h1 className="text-2xl font-semibold tracking-tight">Create your digital card</h1>
      <p className="mb-8 mt-1 text-sm text-zinc-500">Free to start. Takes less than two minutes.</p>
      <AuthForm
        action={registerAction}
        submitLabel="Create account"
        fields={[
          { name: "full_name", label: "Full name", autoComplete: "name" },
          {
            name: "username",
            label: "Username",
            autoComplete: "username",
            placeholder: "yourname",
            hint: `Your card URL: ${host}/p/yourname`,
          },
          { name: "email", label: "Email", type: "email", autoComplete: "email" },
          {
            name: "password",
            label: "Password",
            type: "password",
            autoComplete: "new-password",
            hint: "8+ characters with a letter and a number",
          },
        ]}
        footer={
          <p className="text-center text-sm text-zinc-600">
            Already have an account?{" "}
            <Link href="/login" className="font-medium text-brand hover:underline">
              Sign in
            </Link>
          </p>
        }
      />
    </>
  );
}
