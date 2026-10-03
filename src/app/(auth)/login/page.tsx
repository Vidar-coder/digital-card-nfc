import type { Metadata } from "next";
import Link from "next/link";
import { AuthForm } from "@/components/auth/auth-form";
import { loginAction } from "../actions";

export const metadata: Metadata = { title: "Sign in" };

export default async function LoginPage(props: PageProps<"/login">) {
  const { next, error } = await props.searchParams;
  return (
    <>
      <h1 className="text-2xl font-semibold tracking-tight">Welcome back</h1>
      <p className="mb-8 mt-1 text-sm text-zinc-500">Sign in to manage your digital card.</p>
      {error === "link" && (
        <p className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">That link is invalid or has expired.</p>
      )}
      <AuthForm
        action={loginAction}
        submitLabel="Sign in"
        hidden={{ next: typeof next === "string" ? next : "/dashboard" }}
        fields={[
          { name: "email", label: "Email", type: "email", autoComplete: "email" },
          { name: "password", label: "Password", type: "password", autoComplete: "current-password" },
        ]}
        footer={
          <div className="flex justify-between text-sm">
            <Link href="/forgot-password" className="text-zinc-600 hover:text-zinc-900">
              Forgot password?
            </Link>
            <Link href="/register" className="font-medium text-brand hover:underline">
              Create account
            </Link>
          </div>
        }
      />
    </>
  );
}
