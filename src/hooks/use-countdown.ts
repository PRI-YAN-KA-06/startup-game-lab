import { useEffect, useState } from "react";

/**
 * Counts down to `startedAt + durationMs` using the device clock.
 * Both operator and player devices read the same server-stamped start time,
 * so everyone's clock dies at the same moment.
 *
 * The effect is a pure subscription: a 150ms heartbeat whose first beat lands
 * in a macrotask, so a freshly stamped round is never judged by a stale
 * (or zeroed) clock — the value is only ever read from the interval callback.
 */
export function useCountdown(
  startedAt?: number | null,
  durationMs?: number | null,
) {
  const [now, setNow] = useState(0);

  useEffect(() => {
    const beat = () => setNow(Date.now());
    const first = window.setTimeout(beat, 0);
    const id = window.setInterval(beat, 150);
    return () => {
      window.clearTimeout(first);
      window.clearInterval(id);
    };
  }, []);

  if (!startedAt || !durationMs) {
    return {
      remainingMs: 0,
      secondsLeft: 0,
      pctLeft: 0,
      expired: true,
      running: false,
    };
  }

  // clamped to [0, duration] so a not-yet-ticked clock can never report the
  // round as already over (that would auto-lock a round the moment it opens)
  const remainingMs = Math.max(
    0,
    Math.min(durationMs, startedAt + durationMs - now),
  );

  return {
    remainingMs,
    secondsLeft: Math.ceil(remainingMs / 1000),
    pctLeft: remainingMs / durationMs,
    expired: remainingMs <= 0,
    running: remainingMs > 0,
  };
}
