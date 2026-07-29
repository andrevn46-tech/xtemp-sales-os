"use client";

import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/form";
import { createClient } from "@/lib/supabase/client";
import { useState } from "react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const supabase = createClient();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("sending");
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    setStatus(error ? "error" : "sent");
  }

  return (
    <div className="min-h-screen bg-panel flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="font-display font-bold text-2xl text-panel-ink tracking-tight">
            AVN
          </div>
          <div className="text-xs font-mono uppercase tracking-widest text-signal mt-1">
            Sales OS
          </div>
        </div>

        <div className="bg-panel-raised border border-panel-line rounded-lg p-6">
          {status === "sent" ? (
            <div className="text-center py-4">
              <p className="text-panel-ink text-sm font-medium mb-1">Check your inbox</p>
              <p className="text-panel-ink-dim text-xs">
                We sent a sign-in link to {email}. Open it on this device to continue.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <Field label="Work email" htmlFor="email" required>
                <Input
                  id="email"
                  type="email"
                  required
                  placeholder="andre@xtemp.co.za"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-panel text-panel-ink border-panel-line placeholder:text-panel-ink-dim"
                />
              </Field>
              <Button type="submit" disabled={status === "sending"} className="w-full">
                {status === "sending" ? "Sending link…" : "Send sign-in link"}
              </Button>
              {status === "error" && (
                <p className="text-alert text-xs">
                  Something went wrong sending the link. Try again.
                </p>
              )}
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
