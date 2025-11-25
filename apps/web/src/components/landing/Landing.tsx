// Bounded Context Owner: Identity & Access Management Guild
"use client";

import { Fragment, useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Button,
  Heading,
  _Text,
  Card,
  CardContent,
  HiveLogo,
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
  InputOTPSeparator
} from "@hive/ui";

const ACCESS_STORAGE_KEY = "hive.lab.access.granted";

const experienceHighlights = [
  {
    title: "Ritual prototypes",
    body: "Pilot cadence builders, automation hooks, and accountability loops for campus crews."
  },
  {
    title: "Tool experiments",
    body: "Ship Hive-native utilities, gather telemetry, and iterate with partner feedback in real time."
  },
  {
    title: "Navigation futures",
    body: "Pressure-test sidebar layouts, mobile chrome, and command palette flows before launch."
  },
  {
    title: "Leader controls",
    body: "Gate access, seed cohorts, and manage pilot programs without leaving the LAB."
  }
] as const;

export function Landing(): JSX.Element {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showGenerator, setShowGenerator] = useState(false);
  const [generatedCode, setGeneratedCode] = useState<string | null>(null);
  const [copyState, setCopyState] = useState<"idle" | "copied" | "error">("idle");

  const configuredCodes = useMemo(() => {
    const multi = process.env.NEXT_PUBLIC_HIVELAB_ACCESS_CODES ?? "";
    const legacy = process.env.NEXT_PUBLIC_HIVELAB_ACCESS_CODE ?? "";
    const merged = [multi, legacy]
      .join(",")
      .split(/[\s,]+/u)
      .map((token) => token.trim())
      .filter((token) => token.length === 6 && /^\d+$/.test(token));
    return Array.from(new Set(merged));
  }, []);

  const hasConfiguredCodes = configuredCodes.length > 0;
  const sanitizedCode = useMemo(() => code.replace(/\D+/g, "").slice(0, 6), [code]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.sessionStorage.getItem(ACCESS_STORAGE_KEY) === "true") {
      router.replace("/hivelab");
    }
  }, [router]);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!hasConfiguredCodes) {
      setError("Access codes are not configured. Add NEXT_PUBLIC_HIVELAB_ACCESS_CODES to your env before launch.");
      return;
    }

    if (sanitizedCode.length !== 6) {
      setError("Enter the 6-digit access code.");
      return;
    }

    setIsSubmitting(true);

    const isMatch = configuredCodes.includes(sanitizedCode);
    if (isMatch) {
      if (typeof window !== "undefined") {
        window.sessionStorage.setItem(ACCESS_STORAGE_KEY, "true");
      }
      router.push("/hivelab");
    } else {
      setError("That code doesn’t match. Try again.");
      setIsSubmitting(false);
    }
  };

  const handleGenerateCode = useCallback(() => {
    const buffer =
      typeof window !== "undefined" && window.crypto ? window.crypto.getRandomValues(new Uint32Array(1))[0] : Math.random() * 1_000_000;
    const nextCode = Math.floor(buffer % 1_000_000)
      .toString()
      .padStart(6, "0");
    setGeneratedCode(nextCode);
    setCopyState("idle");
  }, []);

  const handleCopyGenerated = useCallback(async () => {
    if (!generatedCode) return;

    try {
      if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(generatedCode);
        setCopyState("copied");
        setTimeout(() => setCopyState("idle"), 3000);
      } else {
        throw new Error("Clipboard unavailable");
      }
    } catch {
      setCopyState("error");
    }
  }, [generatedCode]);

  return (
    <div className="min-h-screen bg-[var(--hive-background-page,#07080d)] py-16 sm:py-24">
      <div className="mx-auto max-w-6xl px-4">
          <div className="grid items-center gap-14 lg:grid-cols-[minmax(0,1fr)_minmax(360px,420px)]">
            <div className="flex flex-col gap-12 text-left text-foreground">
              <div className="space-y-6">
                <div className="relative flex flex-col gap-4">
                  <div className="flex items-center gap-6">
                    <div className="glitch-logo relative">
                      <HiveLogo variant="gradient" size="2xl" className="drop-shadow-[0_0_28px_rgba(255,196,26,0.35)]" aria-hidden />
                      <HiveLogo variant="white" size="2xl" className="glitch-logo__layer glitch-logo__layer--offset" aria-hidden />
                      <HiveLogo variant="default" size="2xl" className="glitch-logo__layer glitch-logo__layer--offset-alt" aria-hidden />
                    </div>
                    <span className="glitch-text text-4xl font-semibold uppercase tracking-[0.45em]" data-text="HIVE(LAB)">
                      HIVE(LAB)
                    </span>
                  </div>
                  <p className="w-fit rounded-full border border-border/40 bg-card/60 px-4 py-1 tracking-[0.35em] text-muted-foreground text-[0.65rem] uppercase">
                    Experimental campus control center
                  </p>
                  <Heading level={1} className="max-w-3xl text-foreground">
                    Where Hive’s next wave is designed, tested, and launched with the community.
                  </Heading>
                  <p className="max-w-2xl text-sm text-muted-foreground">
                    HiveLAB is our staging ground for campus rituals, navigation systems, and automation flows. Leaders, operators, and build crews
                    join here first to stress test ideas before they reach every Hive member.
                  </p>
                </div>
              </div>

              <div className="grid gap-6 sm:grid-cols-2">
                {experienceHighlights.map((feature) => (
                  <Card key={feature.title} className="border-border/60 bg-card/70 backdrop-blur">
                    <CardContent className="flex flex-col gap-3 px-5 py-6">
                      <Heading level={3} className="text-base font-semibold uppercase tracking-[0.3em] text-foreground">
                        {feature.title}
                      </Heading>
                      <p className="text-xs text-muted-foreground">
                        {feature.body}
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            <Card className="border-border/70 bg-card/80 shadow-[0_22px_68px_-24px_rgba(22,24,29,0.85)] backdrop-blur">
              <CardContent className="flex flex-col gap-8 px-9 py-10">
                <div className="space-y-2 text-center">
                  <Heading level={2} className="text-sm font-semibold uppercase tracking-[0.45em] text-muted-foreground">
                    HiveLAB access gate
                  </Heading>
                  <Heading level={3} className="text-2xl font-semibold text-foreground">
                    Enter your six-digit key
                  </Heading>
                  <p className="text-xs text-muted-foreground">
                    Keys rotate often—grab one from your launch brief or the HiveLAB ops channel, then drop it below to unlock the build lane.
                  </p>
                </div>

                <form onSubmit={handleSubmit} className="flex flex-col items-center gap-5">
                  <InputOTP
                    value={sanitizedCode}
                    onChange={(value) => {
                      const next = value.replace(/\D+/g, "").slice(0, 6);
                      setCode(next);
                      setError(null);
                    }}
                    maxLength={6}
                    pattern="\\d*"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    containerClassName="gap-4"
                    className="text-2xl"
                    aria-label="HiveLAB access code"
                  >
                    <InputOTPGroup className="flex items-center gap-4 rounded-2xl border border-border/70 bg-background/70 px-6 py-4 ring-1 ring-border/30">
                      {Array.from({ length: 6 }).map((_, index) => (
                        <Fragment key={index}>
                          <InputOTPSlot
                            index={index}
                            className="h-16 w-12 rounded-xl border border-border/50 bg-card/70 text-2xl font-semibold tracking-[0.2em] shadow-[0_0_18px_rgba(53,58,69,0.35)]"
                          />
                          {index === 1 || index === 3 ? <InputOTPSeparator className="text-muted-foreground" /> : null}
                        </Fragment>
                      ))}
                    </InputOTPGroup>
                  </InputOTP>
                  <Button type="submit" size="lg" variant="brand" className="w-full" disabled={isSubmitting || sanitizedCode.length !== 6}>
                    {isSubmitting ? "Checking…" : "Enter HiveLAB"}
                  </Button>
                </form>

                {error ? (
                  <p className="text-xs text-destructive text-center" role="alert">
                    {error}
                  </p>
                ) : (
                  <p className="text-xs text-muted-foreground text-center">
                    Need a key? Ping the HiveLAB crew. Access persists for this session once validated.
                  </p>
                )}

                <div className="space-y-4 rounded-2xl border border-dashed border-border/60 bg-muted/10 p-6">
                  <div className="flex items-center justify-between gap-2">
                    <Heading level={3} className="text-xs font-semibold uppercase tracking-[0.4em] text-muted-foreground">
                      Operator utilities
                    </Heading>
                    <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground" type="button" onClick={() => setShowGenerator((prev) => !prev)}>
                      {showGenerator ? "Hide tools" : "Generate code"}
                    </Button>
                  </div>

                  {showGenerator ? (
                    <div className="space-y-4">
                      <p className="text-xs text-muted-foreground">
                        Generate a fresh key, add it to `NEXT_PUBLIC_HIVELAB_ACCESS_CODES`, redeploy, then share with your pilot cohort.
                      </p>
                      <div className="flex flex-wrap items-center gap-3">
                        <Button variant="outline" size="sm" type="button" onClick={handleGenerateCode}>
                          Generate code
                        </Button>
                        {generatedCode ? (
                          <div className="flex items-center gap-2 rounded-full border border-border/50 bg-background/80 px-4 py-2">
                            <code className="text-lg font-semibold tracking-[0.35em] text-foreground">{generatedCode}</code>
                            <Button variant="ghost" size="sm" type="button" onClick={handleCopyGenerated}>
                              {copyState === "copied" ? "Copied" : copyState === "error" ? "Retry" : "Copy"}
                            </Button>
                          </div>
                        ) : null}
                      </div>
                      {copyState === "error" ? (
                        <p className="text-xs text-destructive">
                          Clipboard permissions blocked. Copy manually before sharing.
                        </p>
                      ) : null}
                      <p className="text-xs text-muted-foreground/80">
                        Active codes configured: {configuredCodes.length}
                      </p>
                      {!hasConfiguredCodes ? (
                        <p className="text-xs text-destructive">
                          No active codes detected. Update your env before launch.
                        </p>
                      ) : null}
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground">
                      Quickly generate pilot keys, copy them, and keep launch cadence tight.
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

      <style jsx>{`
        .glitch-logo {
          filter: drop-shadow(0 0 12px rgba(255, 196, 26, 0.25));
        }

        .glitch-logo__layer {
          position: absolute;
          inset: 0;
          opacity: 0.6;
          mix-blend-mode: screen;
          animation: glitch-shift-logo 3.2s infinite ease-in-out alternate;
        }

        .glitch-logo__layer--offset {
          transform: translate(-2px, -1px);
          color: hsl(var(--accent));
        }

        .glitch-logo__layer--offset-alt {
          transform: translate(2px, 1px);
          color: hsl(var(--primary));
          animation-delay: 1.2s;
        }

        .glitch-text {
          position: relative;
          color: hsl(var(--foreground));
          animation: glitch-skew 5s ease-in-out infinite alternate;
        }

        .glitch-text::before,
        .glitch-text::after {
          content: attr(data-text);
          position: absolute;
          inset: 0;
          opacity: 0.7;
          mix-blend-mode: screen;
          pointer-events: none;
        }

        .glitch-text::before {
          color: hsl(var(--accent));
          animation: glitch-shift-left 2.8s infinite linear alternate;
          clip-path: inset(0 0 65% 0);
        }

        .glitch-text::after {
          color: hsl(var(--primary));
          animation: glitch-shift-right 3.2s infinite linear alternate;
          clip-path: inset(35% 0 0 0);
        }

        @keyframes glitch-skew {
          0% {
            transform: skew(0deg);
          }
          25% {
            transform: skew(1deg);
          }
          50% {
            transform: skew(0deg);
          }
          75% {
            transform: skew(-1deg);
          }
          100% {
            transform: skew(0deg);
          }
        }

        @keyframes glitch-shift-left {
          0% {
            transform: translate(0, 0);
          }
          25% {
            transform: translate(-2px, -1px);
          }
          50% {
            transform: translate(0, 1px);
          }
          75% {
            transform: translate(-1px, 0);
          }
          100% {
            transform: translate(-2px, 2px);
          }
        }

        @keyframes glitch-shift-right {
          0% {
            transform: translate(0, 0);
          }
          25% {
            transform: translate(2px, 1px);
          }
          50% {
            transform: translate(0, -1px);
          }
          75% {
            transform: translate(1px, 0);
          }
          100% {
            transform: translate(2px, -2px);
          }
        }

        @keyframes glitch-shift-logo {
          0% {
            transform: translate(0, 0);
          }
          33% {
            transform: translate(2px, -1px);
          }
          66% {
            transform: translate(-2px, 1px);
          }
          100% {
            transform: translate(3px, -2px);
          }
        }
      `}</style>
    </div>
  );
}
