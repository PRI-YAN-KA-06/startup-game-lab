import { useAuth } from "@/hooks/use-auth";
import { BulbIcon, CircleCluster } from "@/components/brand/Brand";
import { PlayerJoinForm } from "@/components/player/PlayerJoinForm";
import { EVENT } from "@/data/config";
import { Loader2 } from "lucide-react";
import { Suspense, useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router";

interface AuthProps {
  redirectAfterAuth?: string;
}

function resolveRedirectAfterAuth(
  returnTo: string | null,
  fallback = "/operator",
) {
  if (returnTo?.startsWith("/") && !returnTo.startsWith("//")) {
    return returnTo;
  }
  return fallback;
}

function Auth({ redirectAfterAuth }: AuthProps = {}) {
  const { isLoading: authLoading, isAuthenticated, signIn } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirect = resolveRedirectAfterAuth(
    searchParams.get("returnTo"),
    redirectAfterAuth,
  );
  const [step, setStep] = useState<"signIn" | { email: string }>("signIn");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState<null | "email" | "otp" | "guest">(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      navigate(redirect);
    }
  }, [authLoading, isAuthenticated, navigate, redirect]);

  async function handleEmailSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy("email");
    setError(null);
    try {
      const formData = new FormData(event.currentTarget);
      await signIn("email-otp", formData);
      setStep({ email: formData.get("email") as string });
    } catch (err) {
      console.error("Email sign-in error:", err);
      setError("Could not send the code. Try the quick operator sign-in.");
    } finally {
      setBusy(null);
    }
  }

  async function handleOtpSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy("otp");
    setError(null);
    try {
      const formData = new FormData(event.currentTarget);
      await signIn("email-otp", formData);
      navigate(redirect);
    } catch (err) {
      console.error("OTP verification error:", err);
      setError("That verification code is incorrect.");
      setCode("");
    } finally {
      setBusy(null);
    }
  }

  async function handleGuestLogin() {
    setBusy("guest");
    setError(null);
    try {
      await signIn("anonymous");
      navigate(redirect);
    } catch (err) {
      console.error("Operator sign-in error:", err);
      setError("Quick sign-in failed — try the email code instead.");
    } finally {
      setBusy(null);
    }
  }

  const inputClass =
    "w-full border-[3px] border-ink bg-white px-3 py-3 text-base font-bold outline-none placeholder:font-medium placeholder:text-ink/40 focus:bg-sun/30";

  return (
    <div className="min-h-screen bg-paper lg:grid lg:grid-cols-[1.05fr_1fr]">
      {/* ---------- brand side ---------- */}
      <aside className="relative hidden overflow-hidden border-r-[3px] border-ink bg-ink p-8 text-white lg:flex lg:flex-col lg:justify-between">
        <CircleCluster
          className="pointer-events-none absolute -right-16 -top-16 h-80 w-80 opacity-40"
          style={{ mixBlendMode: "normal" }}
        />
        <Link to="/" className="relative flex items-center gap-3">
          <span className="relative block size-11 border-[3px] border-white">
            <BulbIcon on className="absolute inset-0 size-full p-0.5" />
          </span>
          <span>
            <span className="nb-display block text-lg">IIC</span>
            <span className="block text-[10px] font-bold uppercase tracking-[0.18em] text-white/60">
              {EVENT.cell}
            </span>
          </span>
        </Link>

        <div className="relative">
          <span className="nb-tag bg-sun text-ink">Startup School</span>
          <h1 className="nb-display mt-4 text-5xl leading-[0.95]">
            Two doors.
            <br />
            <span className="text-sun">One arena.</span>
          </h1>
          <p className="mt-4 max-w-sm text-sm font-medium leading-relaxed text-white/70">
            {EVENT.university} runs the clock from the operator door. Players
            walk in through the QR, sign in with the event passcode, and play
            from their own devices.
          </p>
        </div>

        <ul className="relative grid gap-2 text-sm font-bold">
          <li className="border-2 border-white/30 px-3 py-2">
            Operator → console, timer, reveal, star fuel
          </li>
          <li className="border-2 border-white/30 px-3 py-2">
            Player → questions, options, stars
          </li>
        </ul>
      </aside>

      {/* ---------- forms side ---------- */}
      <main className="flex items-center justify-center px-4 py-8 sm:px-6">
        <div className="grid w-full max-w-md gap-5">
          <div className="flex items-center justify-between">
            <Link to="/" className="nb-tag bg-white">
              ← Back home
            </Link>
            <span className="nb-tag bg-coral text-white">Pick your door</span>
          </div>

          {/* operator */}
          <section className="nb-panel nb-shadow overflow-hidden">
            <div className="flex items-center justify-between border-b-[3px] border-ink bg-sun px-4 py-3">
              <span className="nb-display text-lg">Operator login</span>
              <span className="nb-tag bg-ink text-white">Host</span>
            </div>
            <div className="p-5">
              {step === "signIn" ? (
                <form onSubmit={handleEmailSubmit} className="grid gap-3">
                  <p className="text-sm font-medium text-ink/70">
                    For the person running the room — console, clock and reveal
                    controls.
                  </p>
                  <input
                    name="email"
                    type="email"
                    required
                    placeholder="operator@college.edu"
                    className={inputClass}
                    disabled={busy !== null}
                  />
                  {error && (
                    <p className="border-[3px] border-ink bg-coral px-3 py-2 text-sm font-bold text-white">
                      {error}
                    </p>
                  )}
                  <button
                    type="submit"
                    disabled={busy !== null}
                    className="nb-btn bg-ink text-white"
                  >
                    {busy === "email" ? (
                      <>
                        <Loader2 className="size-4 animate-spin" /> Sending…
                      </>
                    ) : (
                      "Email me a code →"
                    )}
                  </button>
                  <button
                    type="button"
                    disabled={busy !== null}
                    onClick={handleGuestLogin}
                    className="nb-btn bg-white"
                  >
                    {busy === "guest" ? (
                      <>
                        <Loader2 className="size-4 animate-spin" /> Signing
                        in…
                      </>
                    ) : (
                      "Quick operator sign-in"
                    )}
                  </button>
                </form>
              ) : (
                <form onSubmit={handleOtpSubmit} className="grid gap-3">
                  <p className="text-sm font-medium text-ink/70">
                    We sent a 6-digit code to <b>{step.email}</b>.
                  </p>
                  <input
                    value={code}
                    onChange={(e) =>
                      setCode(e.target.value.replace(/\D/g, "").slice(0, 6))
                    }
                    inputMode="numeric"
                    placeholder="••••••"
                    className={`${inputClass} nb-display text-center text-3xl tracking-[0.4em]`}
                  />
                  <input type="hidden" name="email" value={step.email} />
                  <input type="hidden" name="code" value={code} />
                  {error && (
                    <p className="border-[3px] border-ink bg-coral px-3 py-2 text-sm font-bold text-white">
                      {error}
                    </p>
                  )}
                  <button
                    type="submit"
                    disabled={busy !== null || code.length !== 6}
                    className="nb-btn bg-ink text-white"
                  >
                    {busy === "otp" ? "Verifying…" : "Verify & open console →"}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setStep("signIn");
                      setError(null);
                    }}
                    className="nb-btn bg-white !py-2 text-xs"
                  >
                    Use a different email
                  </button>
                </form>
              )}
            </div>
          </section>

          {/* player */}
          <section className="nb-panel nb-shadow overflow-hidden">
            <div className="flex items-center justify-between border-b-[3px] border-ink bg-cobalt px-4 py-3 text-white">
              <span className="nb-display text-lg">Player login</span>
              <span className="nb-tag bg-mint text-ink">Arena</span>
            </div>
            <div className="p-5">
              <p className="mb-4 text-sm font-medium text-ink/70">
                Room code from the big screen + the passcode announced by IIC.
              </p>
              <PlayerJoinForm
                defaultRoom={searchParams.get("room") ?? ""}
                onJoined={(session) =>
                  navigate(`/play?room=${session.roomCode}`, { replace: true })
                }
              />
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}

export default function AuthPage(props: AuthProps) {
  return (
    <Suspense>
      <Auth {...props} />
    </Suspense>
  );
}
