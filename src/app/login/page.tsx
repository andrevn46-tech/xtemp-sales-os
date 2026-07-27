"use client";

import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/form";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [step, setStep] = useState<"email" | "code">("email");
  const [status, setStatus] = useState<"idle" | "sending" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const supabase = createClient();
  const router = useRouter();

  async function handleSendCode(e: React.FormEvent) {
    e.preventDefault();
    setStatus("sending");
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { shouldCreateUser: true },
    });
    if (error) {
      setErrorMsg(error.message);
      setStatus("error");
    } else {
      setStep("code");
      setStatus("idle");
    }
  }

  async function handleVerifyCode(e: React.FormEvent) {
    e.preventDefault();
    setStatus("sending");
    const { error } = await supabase.auth.verifyOtp({
      email,
      token: code,
      type: "email",
    });
    if (error) {
      setErrorMsg(error.message);
      setStatus("error");
    } else {
      router.push("/");
      router.refresh();
    }
  }

  return (
    <div className="min-h-screen bg-panel flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="font-display font-bold text-2xl text-panel-ink tracking-tight">
            XTEMP
          </div>
          <div className="text-xs font-mono uppercase tracking-widest text-signal mt-1">
            Sales Operating System
          </div>
        </div>

        <div className="bg-panel-raised border border-panel-line rounded-lg p-6">
          {step === "email" ? (
            <form onSubmit={handleSendCode} className="flex flex-col gap-4">
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
                {status === "sending" ? "Sending code…" : "Send code"}
              </Button>
              {status === "error" && <p className="text-alert text-xs">{errorMsg}</p>}
            </form>
          ) : (
            <form onSubmit={handleVerifyCode} className="flex flex-col gap-4">
              <p className="text-panel-ink-dim text-xs">
                We sent a 6-digit code to {email}. Enter it below.
              </p>
              <Field label="Code" htmlFor="code" required>
                <Input
                  id="code"
                  type="text"
                  inputMode="numeric"
                  required
                  placeholder="123456"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  className="bg-panel text-panel-ink border-panel-line placeholder:text-panel-ink-dim tracking-widest text-center"
                />
              </Field>
              <Button type="submit" disabled={status === "sending"} className="w-full">
                {status === "sending" ? "Verifying…" : "Verify & sign in"}
              </Button>
              {status === "error" && <p className="text-alert text-xs">{errorMsg}</p>}
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
