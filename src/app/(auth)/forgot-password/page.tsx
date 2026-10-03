import type { Metadata } from "next";
import Link from "next/link";
import { AuthForm } from "@/components/auth/auth-form";
import { forgotPasswordAction } from "../actions";

export const metadata: Metadata = { title: "Reset password" };

export default function ForgotPasswordPage() {
  return (
    <>
      <h1 className="text-2xl font-semibold tracking-tight">Reset your password</h1>
      <p className="mb-8 mt-1 text-sm text-zinc-500">We&apos;ll email you a secure link to choose a new one.</p>
      <AuthForm
        action={forgotPasswordAction}
        submitLabel="Send reset link"
        fields={[{ name: "email", label: "Email", type: "email", autoComplete: "email" }]}
        footer={
          <p className="text-center text-sm">
            <Link href="/login" className="text-zinc-600 hover:text-zinc-900">
              ← Back to sign in
            </Link>
          </p>
        }
      />
    </>
  );
}
