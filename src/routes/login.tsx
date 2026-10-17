import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { type FormEvent, useState } from "react";
import { toast } from "sonner";
import { GROK_PROVIDERS, authClient, authEnabled, signIn } from "@/lib/auth/client";
import { Button, errText, Field } from "@/components/market/ui";
import { SeekLogo } from "@/components/market/brand";
import { ThemeToggle } from "@/components/market/theme";

export const Route = createFileRoute("/login")({
  head: () => ({ meta: [{ title: "Sign in · SEEK" }, { name: "robots", content: "noindex" }] }),
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"in" | "up">("in");
  const [busy, setBusy] = useState(false);
  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const email = String(form.get("email") ?? "");
    const password = String(form.get("password") ?? "");
    const name = String(form.get("name") ?? "Customer");
    setBusy(true);
    try {
      if (mode === "up") {
        const result = await authClient.signUp.email({ email, password, name, callbackURL: "/account" });
        if (result.error) throw new Error(result.error.message ?? "Could not create the account");
      } else {
        const result = await authClient.signIn.email({ email, password, callbackURL: "/account" });
        if (result.error) throw new Error(result.error.message ?? "Could not sign in");
      }
      void navigate({ to: "/account" });
    } catch (error) {
      toast.error(errText(error));
    } finally {
      setBusy(false);
    }
  }
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center px-4 py-10">
      <div className="mb-4 flex justify-end">
        <ThemeToggle />
      </div>
      <SeekLogo className="h-14" />
      <p className="mt-3 text-sm font-medium text-primary">Building on Trust.</p>
      <h1 className="mt-2 text-lg font-semibold">{mode === "in" ? "Sign in" : "Create an account"}</h1>
      <p className="mt-1 text-sm text-muted">You can browse without an account. Sign in before you place an order.</p>
      {authEnabled ? (
        <form onSubmit={onSubmit} className="mt-5 space-y-2">
          {mode === "up" ? <Field name="name" required placeholder="Your name" aria-label="Name" /> : null}
          <Field name="email" type="email" required placeholder="Email" aria-label="Email" autoComplete="email" />
          <Field name="password" type="password" required minLength={8} placeholder="Password" aria-label="Password" autoComplete={mode === "up" ? "new-password" : "current-password"} />
          <Button className="w-full" type="submit" disabled={busy}>{busy ? "Please wait…" : mode === "in" ? "Sign in" : "Create account"}</Button>
          <button type="button" className="text-sm font-semibold text-primary" onClick={() => setMode(mode === "in" ? "up" : "in")}>
            {mode === "in" ? "Need an account? Create one" : "Already registered? Sign in"}
          </button>
        </form>
      ) : (
        <p className="mt-4 text-sm">Sign-in is turned off.</p>
      )}
      <div className="mt-6 space-y-2">
        {GROK_PROVIDERS.map((provider) => (
          <Button key={provider.providerId} variant="surface" className="w-full" type="button" onClick={() => void signIn(provider.providerId, { callbackURL: "/account" })}>
            Continue with {provider.label}
          </Button>
        ))}
      </div>
    </main>
  );
}
