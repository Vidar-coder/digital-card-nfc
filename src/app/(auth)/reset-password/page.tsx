import type { Metadata } from "next";
import Link from "next/link";
import { AuthForm } from "@/components/auth/auth-form";
import { resetPasswordAction } from "../actions";

export const metadata: Metadata = { title: "Choose a new password", robots: { index: false } };

export default async function ResetPasswordPage(props: PageProps<"/reset-password">) {
  const { token } = await props.searchParams;
  const value = typeof token === "string" ? token : "";

  return (
    <>
      <h1 className="text-2xl font-semibold tracking-tight">Choose a new password</h1>
      <p className="mb-8 mt-1 text-sm text-zinc-500">You&apos;ll be signed in right after.</p>
      {value ? (
        <AuthForm
          action={resetPasswordAction}
          submitLabel="Update password"
          hidden={{ token: value }}
          fields={[
            { name: "password", label: "New password", type: "password", autoComplete: "new-password", hint: "8+ characters with a letter and a number" },
            { name: "confirm", label: "Confirm password", type: "password", autoComplete: "new-password" },
          ]}
        />
      ) : (
        <p className="rounded-lg bg-red-50 px-3 py-2.5 text-sm text-red-700">
          This link is missing its reset token.{" "}
          <Link href="/forgot-password" className="font-medium underline">
            Request a new link
          </Link>
          .
        </p>
      )}
    </>
  );
}
