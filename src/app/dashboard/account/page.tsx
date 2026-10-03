"use client";

import { LogOut } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { signOutAction, updateEmailAction, updatePasswordAction } from "@/app/dashboard/actions";
import { useDashboard } from "@/components/dashboard/dashboard-context";
import { PageHeader } from "@/components/dashboard/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardHeader } from "@/components/ui/card";
import { Field, Input } from "@/components/ui/field";

export default function AccountPage() {
  const { email } = useDashboard();
  const [emailForm, setEmailForm] = useState({ email, current: "" });
  const [pw, setPw] = useState({ current: "", password: "", confirm: "" });
  type Errs = Record<string, string[] | undefined>;
  const [emailErrors, setEmailErrors] = useState<Errs>({});
  const [pwErrors, setPwErrors] = useState<Errs>({});
  const [busy, setBusy] = useState<"email" | "password" | null>(null);

  async function changeEmail(e: React.FormEvent) {
    e.preventDefault();
    setBusy("email");
    const res = await updateEmailAction(emailForm);
    setBusy(null);
    if (res.ok) {
      toast.success(res.message);
      setEmailForm((f) => ({ ...f, current: "" }));
      setEmailErrors({});
    } else {
      setEmailErrors(res.fieldErrors ?? {});
      toast.error(res.error);
    }
  }

  async function changePassword(e: React.FormEvent) {
    e.preventDefault();
    setBusy("password");
    const res = await updatePasswordAction(pw);
    setBusy(null);
    if (res.ok) {
      toast.success(res.message);
      setPw({ current: "", password: "", confirm: "" });
      setPwErrors({});
    } else {
      setPwErrors(res.fieldErrors ?? {});
      toast.error(res.error);
    }
  }

  return (
    <>
      <PageHeader title="Account" description="Sign-in details and security. Passwords are stored only as secure hashes." />
      <div className="space-y-5">
        <Card>
          <CardHeader title="Sign-in email" description="Not shown publicly unless you also add it under Contact info." />
          <form onSubmit={changeEmail} className="grid gap-4 p-5 sm:grid-cols-2">
            <Field label="Email" error={emailErrors.email?.[0]}>
              {(p) => (
                <Input {...p} type="email" autoComplete="email" value={emailForm.email} onChange={(e) => setEmailForm({ ...emailForm, email: e.target.value })} />
              )}
            </Field>
            <Field label="Current password" error={emailErrors.current?.[0]}>
              {(p) => (
                <Input
                  {...p}
                  type="password"
                  autoComplete="current-password"
                  value={emailForm.current}
                  onChange={(e) => setEmailForm({ ...emailForm, current: e.target.value })}
                />
              )}
            </Field>
            <div className="sm:col-span-2">
              <Button type="submit" loading={busy === "email"} disabled={emailForm.email === email || !emailForm.current}>
                Update email
              </Button>
            </div>
          </form>
        </Card>

        <Card>
          <CardHeader title="Password" description="At least 8 characters with a letter and a number. Other devices are signed out." />
          <form onSubmit={changePassword} className="grid gap-4 p-5 sm:grid-cols-3">
            <Field label="Current password" error={pwErrors.current?.[0]}>
              {(p) => (
                <Input {...p} type="password" autoComplete="current-password" value={pw.current} onChange={(e) => setPw({ ...pw, current: e.target.value })} />
              )}
            </Field>
            <Field label="New password" error={pwErrors.password?.[0]}>
              {(p) => (
                <Input {...p} type="password" autoComplete="new-password" value={pw.password} onChange={(e) => setPw({ ...pw, password: e.target.value })} />
              )}
            </Field>
            <Field label="Confirm new password" error={pwErrors.confirm?.[0]}>
              {(p) => (
                <Input {...p} type="password" autoComplete="new-password" value={pw.confirm} onChange={(e) => setPw({ ...pw, confirm: e.target.value })} />
              )}
            </Field>
            <div className="sm:col-span-3">
              <Button type="submit" loading={busy === "password"} disabled={!pw.current || !pw.password}>
                Update password
              </Button>
            </div>
          </form>
        </Card>

        <Card>
          <CardHeader title="Session" />
          <form action={signOutAction} className="p-5">
            <Button type="submit" variant="outline">
              <LogOut className="size-4" /> Sign out
            </Button>
          </form>
        </Card>
      </div>
    </>
  );
}
