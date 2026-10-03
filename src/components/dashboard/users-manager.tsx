"use client";

import {
  ExternalLink,
  KeyRound,
  Mail,
  MoreHorizontal,
  Search,
  Shield,
  ShieldOff,
  Trash2,
  UserCheck,
  UserPlus,
  UserX,
  Users,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { toast } from "sonner";
import {
  createUserAction,
  deleteUserAction,
  sendPasswordLinkAction,
  setUserRoleAction,
  setUserStatusAction,
} from "@/app/dashboard/users/actions";
import { Badge, Card, EmptyState } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useConfirm } from "@/components/ui/confirm-dialog";
import { Field, Input, Select } from "@/components/ui/field";
import type { SheetAdminUser } from "@/lib/sheets/types";
import type { ActionResult } from "@/lib/types";
import { cn, initials, normalizeUsername } from "@/lib/utils";

function relative(iso: string) {
  if (!iso) return "Never";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  const days = Math.floor((Date.now() - d.getTime()) / 86_400_000);
  if (days < 1) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 30) return `${days} days ago`;
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

/* ---------------------------- row actions menu --------------------------- */

function RowMenu({ user, isSelf, onAction }: { user: SheetAdminUser; isSelf: boolean; onAction: (key: string) => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => !ref.current?.contains(e.target as Node) && setOpen(false);
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", esc);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", esc);
    };
  }, [open]);

  const items = [
    { key: "view", label: "View public card", icon: ExternalLink },
    user.status === "active" && {
      key: "link",
      label: user.has_password ? "Send password reset" : "Resend invite",
      icon: user.has_password ? KeyRound : Mail,
    },
    !isSelf && (user.role === "admin"
      ? { key: "demote", label: "Remove admin rights", icon: ShieldOff }
      : { key: "promote", label: "Make admin", icon: Shield }),
    !isSelf && (user.status === "active"
      ? { key: "suspend", label: "Suspend access", icon: UserX }
      : { key: "activate", label: "Reactivate", icon: UserCheck }),
    !isSelf && { key: "delete", label: "Delete user", icon: Trash2, danger: true },
  ].filter(Boolean) as { key: string; label: string; icon: typeof Mail; danger?: boolean }[];

  return (
    <div ref={ref} className="relative">
      <Button variant="ghost" size="icon" aria-label={`Actions for ${user.username}`} aria-expanded={open} onClick={() => setOpen((v) => !v)}>
        <MoreHorizontal className="size-4" />
      </Button>
      {open && (
        <div role="menu" className="absolute right-0 z-20 mt-1 w-52 overflow-hidden rounded-xl border border-zinc-200 bg-white py-1 shadow-lg">
          {items.map((i) => (
            <button
              key={i.key}
              role="menuitem"
              type="button"
              onClick={() => {
                setOpen(false);
                onAction(i.key);
              }}
              className={cn(
                "flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm hover:bg-zinc-50",
                i.danger ? "text-red-600 hover:bg-red-50" : "text-zinc-700",
              )}
            >
              <i.icon className="size-4" /> {i.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ----------------------------- add user dialog --------------------------- */

function randomPassword() {
  const chars = "abcdefghjkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ23456789";
  const bytes = crypto.getRandomValues(new Uint8Array(12));
  return [...bytes].map((b) => chars[b % chars.length]).join("") + "7a";
}

function AddUserDialog({ open, onClose, onCreated }: { open: boolean; onClose: () => void; onCreated: () => void }) {
  const ref = useRef<HTMLDialogElement>(null);
  const empty = { full_name: "", username: "", email: "", role: "user", mode: "invite", password: "" };
  const [form, setForm] = useState(empty);
  const [usernameTouched, setUsernameTouched] = useState(false);
  const [errors, setErrors] = useState<Record<string, string[] | undefined>>({});
  const [pending, start] = useTransition();

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);

  const set = (k: keyof typeof empty, v: string) => setForm((f) => ({ ...f, [k]: v }));

  function submit(e: React.FormEvent) {
    e.preventDefault();
    start(async () => {
      const res = await createUserAction(form);
      if (res.ok) {
        toast.success(res.message, {
          description: form.mode === "password" ? "Share the temporary password securely — they can change it under Account." : undefined,
        });
        setForm(empty);
        setUsernameTouched(false);
        setErrors({});
        onCreated();
        onClose();
      } else {
        setErrors(res.fieldErrors ?? {});
        toast.error(res.error);
      }
    });
  }

  return (
    <dialog
      ref={ref}
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      className="m-auto w-[calc(100%-2rem)] max-w-lg rounded-2xl bg-white p-0 shadow-2xl backdrop:bg-zinc-950/40"
      aria-labelledby="add-user-title"
    >
      <form onSubmit={submit} className="p-6">
        <h2 id="add-user-title" className="text-lg font-semibold text-zinc-900">
          Add a user
        </h2>
        <p className="mt-1 text-sm text-zinc-500">They get their own card, profile URL and dashboard, and can only edit their own data.</p>

        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <Field label="Full name" error={errors.full_name?.[0]} className="sm:col-span-2">
            {(p) => (
              <Input
                {...p}
                value={form.full_name}
                autoFocus
                onChange={(e) => {
                  set("full_name", e.target.value);
                  if (!usernameTouched) set("username", normalizeUsername(e.target.value).replace(/[^a-z0-9_-]/g, "").slice(0, 30));
                }}
              />
            )}
          </Field>
          <Field label="Username" error={errors.username?.[0]} hint="Their card URL: /p/username">
            {(p) => (
              <Input
                {...p}
                value={form.username}
                autoCapitalize="none"
                spellCheck={false}
                onChange={(e) => {
                  setUsernameTouched(true);
                  set("username", normalizeUsername(e.target.value));
                }}
              />
            )}
          </Field>
          <Field label="Role" error={errors.role?.[0]}>
            {(p) => (
              <Select {...p} value={form.role} onChange={(e) => set("role", e.target.value)}>
                <option value="user">User — edits own card</option>
                <option value="admin">Admin — also manages users</option>
              </Select>
            )}
          </Field>
          <Field label="Email" error={errors.email?.[0]} className="sm:col-span-2">
            {(p) => <Input {...p} type="email" value={form.email} onChange={(e) => set("email", e.target.value)} />}
          </Field>
        </div>

        <fieldset className="mt-5">
          <legend className="mb-2 text-sm font-medium text-zinc-800">How will they sign in?</legend>
          <div className="grid gap-2 sm:grid-cols-2">
            {[
              { v: "invite", t: "Email an invite", d: "They set their own password (link valid 3 days)." },
              { v: "password", t: "Set a temporary password", d: "You share it with them directly." },
            ].map((o) => (
              <label
                key={o.v}
                className={cn(
                  "cursor-pointer rounded-xl border p-3 text-sm transition",
                  form.mode === o.v ? "border-brand bg-indigo-50/60 ring-2 ring-brand/20" : "border-zinc-200 hover:border-zinc-300",
                )}
              >
                <input type="radio" name="mode" value={o.v} checked={form.mode === o.v} onChange={() => set("mode", o.v)} className="sr-only" />
                <span className="block font-medium text-zinc-900">{o.t}</span>
                <span className="block text-xs text-zinc-500">{o.d}</span>
              </label>
            ))}
          </div>
        </fieldset>

        {form.mode === "password" && (
          <Field label="Temporary password" error={errors.password?.[0]} hint="8+ characters with a letter and a number" className="mt-4">
            {(p) => (
              <div className="flex gap-2">
                <Input {...p} value={form.password} onChange={(e) => set("password", e.target.value)} autoComplete="new-password" spellCheck={false} />
                <Button variant="outline" onClick={() => set("password", randomPassword())}>
                  Generate
                </Button>
              </div>
            )}
          </Field>
        )}

        <div className="mt-6 flex justify-end gap-2">
          <Button variant="outline" onClick={onClose} disabled={pending}>
            Cancel
          </Button>
          <Button type="submit" loading={pending}>
            <UserPlus className="size-4" /> {form.mode === "invite" ? "Create & send invite" : "Create user"}
          </Button>
        </div>
      </form>
    </dialog>
  );
}

/* --------------------------------- page ---------------------------------- */

export function UsersManager({ users, currentUserId }: { users: SheetAdminUser[]; currentUserId: string }) {
  const router = useRouter();
  const confirm = useConfirm();
  const [query, setQuery] = useState("");
  const [adding, setAdding] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return users;
    return users.filter((u) => [u.full_name, u.username, u.email].some((v) => v?.toLowerCase().includes(q)));
  }, [users, query]);

  const stats = [
    { label: "Users", value: users.length },
    { label: "Admins", value: users.filter((u) => u.role === "admin").length },
    { label: "Invites pending", value: users.filter((u) => !u.has_password).length },
    { label: "Suspended", value: users.filter((u) => u.status !== "active").length },
  ];

  async function run(user: SheetAdminUser, key: string) {
    if (key === "view") {
      window.open(`/p/${user.username}`, "_blank", "noopener");
      return;
    }
    const name = user.full_name || user.username;
    const confirms: Record<string, Parameters<typeof confirm>[0]> = {
      suspend: { title: `Suspend ${name}?`, description: "They're signed out immediately and can't sign in. Their public card stays online.", confirmLabel: "Suspend", destructive: true },
      delete: { title: `Delete ${name}?`, description: `This permanently removes their account, card (/p/${user.username}) and all their data from the Google Sheet. Analytics history is kept.`, confirmLabel: "Delete user", destructive: true },
      promote: { title: `Make ${name} an admin?`, description: "Admins can create, suspend and delete users and see the Google Sheet settings.", confirmLabel: "Make admin" },
    };
    if (confirms[key] && !(await confirm(confirms[key]))) return;

    setBusy(user.user_id);
    let res: ActionResult;
    if (key === "link") res = await sendPasswordLinkAction(user.user_id);
    else if (key === "suspend") res = await setUserStatusAction(user.user_id, "suspended");
    else if (key === "activate") res = await setUserStatusAction(user.user_id, "active");
    else if (key === "promote") res = await setUserRoleAction(user.user_id, "admin");
    else if (key === "demote") res = await setUserRoleAction(user.user_id, "user");
    else res = await deleteUserAction(user.user_id, false);
    setBusy(null);
    if (res.ok) {
      toast.success(res.message);
      router.refresh();
    } else toast.error(res.error);
  }

  return (
    <>
      <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {stats.map((s) => (
          <Card key={s.label} className="p-4">
            <p className="text-xs font-medium text-zinc-500">{s.label}</p>
            <p className="mt-1 text-2xl font-semibold tabular-nums text-zinc-900">{s.value}</p>
          </Card>
        ))}
      </div>

      <Card>
        <div className="flex flex-col gap-3 border-b border-zinc-100 p-4 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-zinc-400" />
            <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search name, username or email" className="pl-9" aria-label="Search users" />
          </div>
          <Button onClick={() => setAdding(true)}>
            <UserPlus className="size-4" /> Add user
          </Button>
        </div>

        {filtered.length === 0 ? (
          <div className="p-5">
            <EmptyState icon={Users} title={query ? "No matches" : "No users yet"} description={query ? "Try a different search." : "Add your first user to give them their own card and dashboard."} />
          </div>
        ) : (
          <ul className="divide-y divide-zinc-100">
            {filtered.map((u) => {
              const isSelf = u.user_id === currentUserId;
              return (
                <li key={u.user_id} className={cn("flex items-center gap-3 px-4 py-3", busy === u.user_id && "opacity-50")}>
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-violet-500 text-sm font-semibold text-white">
                    {initials(u.full_name || u.username)}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="truncate font-medium text-zinc-900">{u.full_name || u.username}</span>
                      {isSelf && <Badge>You</Badge>}
                      {u.role === "admin" && <Badge tone="brand">Admin</Badge>}
                      {u.status !== "active" && <Badge tone="warning">Suspended</Badge>}
                      {!u.has_password && u.status === "active" && <Badge tone="warning">Invite pending</Badge>}
                    </div>
                    <p className="truncate text-sm text-zinc-500">
                      @{u.username} · {u.email}
                    </p>
                  </div>
                  <div className="hidden text-right text-xs text-zinc-500 md:block">
                    <p>Last sign-in</p>
                    <p className="font-medium text-zinc-700">{relative(u.last_login_at)}</p>
                  </div>
                  <RowMenu user={u} isSelf={isSelf} onAction={(k) => void run(u, k)} />
                </li>
              );
            })}
          </ul>
        )}
      </Card>

      <AddUserDialog open={adding} onClose={() => setAdding(false)} onCreated={() => router.refresh()} />
    </>
  );
}
