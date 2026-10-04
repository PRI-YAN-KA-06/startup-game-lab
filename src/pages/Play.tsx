import { AnimatePresence, motion } from "framer-motion";
import { useMutation, useQuery } from "convex/react";
import { useEffect, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router";
import { BulbIcon, IicLockup } from "@/components/brand/Brand";
import { PlayerJoinForm } from "@/components/player/PlayerJoinForm";
import { api } from "@/convex/_generated/api";
import {
  OPTION_LETTERS,
  OPTION_STYLES,
  QUIZ_TOTAL,
  ROUND_SECONDS,
} from "@/data/config";
import { QUIZ_QUESTIONS } from "@/data/quizQuestions";
import { useCountdown } from "@/hooks/use-countdown";
import {
  clearPlayerSession,
  loadPlayerSession,
  type PlayerSession,
} from "@/lib/player-session";

/* ------------------------------------------------------------------ */
/*  shell                                                              */
/* ------------------------------------------------------------------ */

function PlayerShell({
  session,
  onLeave,
  children,
}: {
  session?: PlayerSession | null;
  onLeave?: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="nb-dots min-h-screen bg-paper">
      <header className="sticky top-0 z-30 border-b-[3px] border-ink bg-paper/95">
        <div className="mx-auto flex max-w-4xl items-center justify-between gap-3 px-4 py-3">
          <Link to="/">
            <IicLockup compact />
          </Link>
          <div className="flex items-center gap-2">
            <span className="nb-tag bg-cobalt text-white">Player device</span>
            {session && (
              <span className="nb-tag bg-white">{session.roomCode}</span>
            )}
            {onLeave && (
              <button
                type="button"
                onClick={onLeave}
                className="nb-tag bg-ink text-white"
              >
                Leave
              </button>
            )}
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-4xl px-4 py-6 sm:py-10">{children}</main>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  join panel                                                         */
/* ------------------------------------------------------------------ */

function JoinPanel({
  defaultRoom,
  onJoined,
}: {
  defaultRoom: string;
  onJoined: (session: PlayerSession) => void;
}) {
  return (
    <div className="mx-auto grid max-w-md gap-6">
      <div className="nb-panel overflow-hidden">
        <div className="flex items-center justify-between border-b-[3px] border-ink bg-sun px-4 py-3">
          <span className="nb-display text-lg">Player login</span>
          <BulbIcon on className="h-8 w-8" />
        </div>
        <div className="p-5">
          <p className="mb-4 text-sm font-medium leading-relaxed text-ink/75">
            Scan the operator's QR or type the 4-letter room code from the big
            screen, then sign in with the passcode IIC announced.
          </p>
          <PlayerJoinForm defaultRoom={defaultRoom} onJoined={onJoined} autoFocusName />
        </div>
      </div>
      <ol className="grid gap-2 text-sm font-bold">
        <li className="border-[3px] border-ink bg-white px-3 py-2">
          1 · Watch the screen for the room code
        </li>
        <li className="border-[3px] border-ink bg-white px-3 py-2">
          2 · Enter your name — that's your identity on the board
        </li>
        <li className="border-[3px] border-ink bg-white px-3 py-2">
          3 · Wait for the operator to start the clock
        </li>
      </ol>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  option button                                                      */
/* ------------------------------------------------------------------ */

function OptionButton({
  index,
  text,
  state,
  onClick,
  disabled,
}: {
  index: number;
  text: string;
  state: "idle" | "picked" | "correct" | "wrong" | "muted";
  onClick?: () => void;
  disabled?: boolean;
}) {
  const stampText =
    state === "correct"
      ? "✓ Correct answer"
      : state === "wrong"
        ? "✗ Not this one"
        : state === "picked"
          ? "✓ Your pick"
          : null;

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`relative flex w-full items-stretch gap-3 border-[3px] border-ink text-left transition-all duration-150 ${
        OPTION_STYLES[index]
      } ${state === "muted" ? "opacity-60" : ""} ${
        disabled ? "cursor-not-allowed" : "hover:-translate-y-0.5"
      }`}
      style={{ boxShadow: "5px 5px 0 #0e0e0e" }}
    >
      <span className="nb-display flex w-12 shrink-0 items-center justify-center border-r-[3px] border-ink bg-white text-xl">
        {OPTION_LETTERS[index]}
      </span>
      <span className="flex-1 px-3 py-3.5 text-sm font-bold leading-snug sm:text-base">
        {text}
        {stampText && (
          <span
            className={`nb-tag mt-2 w-fit ${
              state === "correct"
                ? "bg-ink text-white"
                : state === "wrong"
                  ? "bg-white text-ink"
                  : "bg-ink text-white"
            }`}
          >
            {stampText}
          </span>
        )}
      </span>
    </button>
  );
}

/* ------------------------------------------------------------------ */
/*  arena                                                              */
/* ------------------------------------------------------------------ */

function Arena({
  session,
  onLeave,
}: {
  session: PlayerSession;
  onLeave: () => void;
}) {
  const room = useQuery(api.game.getRoom, { code: session.roomCode });
  const me = useQuery(api.game.getMyPlayer, { playerId: session.playerId });
  const roster = useQuery(api.game.listPlayers, { roomId: session.roomId });
  const submit = useMutation(api.game.submitAnswer);

  const [picks, setPicks] = useState<Record<number, number>>({});
  const [errors, setErrors] = useState<Record<number, string>>({});
  const [burst, setBurst] = useState(false);
  const prevStars = useRef<number | null>(null);

  const phase = room?.phase;
  const questionIndex = room?.questionIndex ?? 0;
  const question = QUIZ_QUESTIONS[questionIndex];
  const countdown = useCountdown(room?.roundStartedAt, room?.timerMs);

  // keyed by question, so a new question always starts clean — no reset effect
  const picked = picks[questionIndex] ?? null;
  const error = errors[questionIndex] ?? null;

  // star burst whenever the player's total ticks up
  useEffect(() => {
    if (me === undefined || me === null) return;
    const prev = prevStars.current;
    prevStars.current = me.stars;
    if (prev !== null && me.stars > prev) {
      setBurst(true);
      const t = window.setTimeout(() => setBurst(false), 1800);
      return () => window.clearTimeout(t);
    }
  }, [me]);

  async function pick(choice: number) {
    if (!room) return;
    const index = room.questionIndex;
    setErrors((prev) => {
      if (!(index in prev)) return prev;
      const next = { ...prev };
      delete next[index];
      return next;
    });
    try {
      await submit({
        roomId: room._id,
        playerId: session.playerId,
        choice,
      });
      setPicks((prev) => ({ ...prev, [index]: choice }));
    } catch (err) {
      setErrors((prev) => ({
        ...prev,
        [index]:
          err instanceof Error ? err.message : "Could not send your pick.",
      }));
    }
  }

  if (room === undefined || me === undefined) {
    return (
      <PlayerShell session={session}>
        <div className="nb-panel mx-auto max-w-md p-8 text-center">
          <p className="nb-display text-xl">Connecting…</p>
        </div>
      </PlayerShell>
    );
  }

  if (room === null || me === null) {
    return (
      <PlayerShell>
        <div className="nb-panel mx-auto max-w-md p-6 text-center">
          <p className="nb-display text-xl">Room closed</p>
          <p className="mt-2 text-sm font-medium text-ink/70">
            {session.roomCode} is no longer running. Ask the operator for the
            new code.
          </p>
          <button
            type="button"
            onClick={onLeave}
            className="nb-btn nb-shadow mt-5 w-full bg-sun"
          >
            Join another room
          </button>
        </div>
      </PlayerShell>
    );
  }

  const correct = question.correct;
  const totalAnswered = roster?.length ?? 0;

  return (
    <PlayerShell session={session} onLeave={onLeave}>
      {/* status strip */}
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3 border-[3px] border-ink bg-white px-4 py-3 shadow-[5px_5px_0_0_#0e0e0e]">
        <div className="flex items-center gap-3">
          <span className="nb-tag bg-cobalt text-white">{me.name}</span>
          <span className="nb-tag bg-sand">
            Q{questionIndex + 1}/{QUIZ_TOTAL}
          </span>
          {totalAnswered > 0 && (
            <span className="nb-tag bg-mint">{totalAnswered} in room</span>
          )}
        </div>
        <div className="nb-tag bg-ink text-base text-white">
          ★ <span className="text-sun">{me.stars}</span> stars
        </div>
      </div>

      {/* timer */}
      {(phase === "voting" || phase === "locked") && (
        <div className="mb-5 border-[3px] border-ink bg-ink px-4 py-3 shadow-[5px_5px_0_0_#0e0e0e]">
          <div className="flex items-center justify-between">
            <span className="nb-display text-sm text-white">
              {phase === "voting" ? "Clock running" : "Time's up"}
            </span>
            <span
              className={`nb-display text-3xl ${
                phase === "voting" && countdown.secondsLeft <= 3
                  ? "text-coral"
                  : "text-sun"
              }`}
            >
              {phase === "voting" ? `${countdown.secondsLeft}s` : "0s"}
            </span>
          </div>
          <div className="mt-2 h-3 w-full border-2 border-white bg-ink">
            <div
              className="h-full bg-sun transition-[width] duration-150 ease-linear"
              style={{
                width: `${(phase === "voting" ? countdown.pctLeft : 0) * 100}%`,
              }}
            />
          </div>
        </div>
      )}

      {/* question card */}
      <div className="nb-panel overflow-hidden">
        <div className="flex items-center justify-between border-b-[3px] border-ink bg-violet px-4 py-2.5 text-white">
          <span className="nb-tag bg-white text-ink">{question.kind}</span>
          <span className="nb-display text-sm">{question.concept}</span>
        </div>

        <div className="p-5">
          <p className="text-lg font-bold leading-snug sm:text-xl">
            {question.prompt}
          </p>

          <div className="mt-5 grid gap-3">
            {phase === "lobby" && (
              <div className="grid place-items-center gap-3 py-8 text-center">
                <BulbIcon
                  className="h-16 w-16"
                  style={{ animation: "nb-float 3s ease-in-out infinite" }}
                />
                <p className="nb-display text-lg">You're in, {me.name}</p>
                <p className="max-w-xs text-sm font-medium text-ink/70">
                  Waiting for the operator to load question 1…
                </p>
              </div>
            )}

            {phase === "question" && (
              <div className="grid place-items-center gap-3 py-8 text-center">
                <div className="flex gap-2">
                  {[0, 1, 2].map((i) => (
                    <span
                      key={i}
                      className="h-4 w-4 border-2 border-ink bg-sun"
                      style={{
                        animation: `nb-float 1s ease-in-out ${i * 0.18}s infinite`,
                      }}
                    />
                  ))}
                </div>
                <p className="nb-display text-lg">Read it. Think fast.</p>
                <p className="max-w-xs text-sm font-medium text-ink/70">
                  The four options land on your screen the second the operator
                  starts the {ROUND_SECONDS}s clock.
                </p>
              </div>
            )}

            {(phase === "voting" || phase === "locked" || phase === "revealed") &&
              question.options.map((opt, i) => {
                let state: "idle" | "picked" | "correct" | "wrong" | "muted" =
                  "idle";
                if (phase === "voting") {
                  state = picked === i ? "picked" : "idle";
                } else if (phase === "locked") {
                  state = picked === i ? "picked" : "muted";
                } else if (phase === "revealed") {
                  if (i === correct) state = "correct";
                  else if (picked === i) state = "wrong";
                  else state = "muted";
                }
                return (
                  <OptionButton
                    key={i}
                    index={i}
                    text={opt}
                    state={state}
                    disabled={phase !== "voting"}
                    onClick={() => phase === "voting" && pick(i)}
                  />
                );
              })}
          </div>

          {error && (
            <p className="mt-4 border-[3px] border-ink bg-coral px-3 py-2 text-sm font-bold text-white">
              {error}
            </p>
          )}

          {phase === "question" && (
            <p className="mt-4 border-[3px] border-dashed border-ink/40 px-3 py-2 text-center text-xs font-bold uppercase tracking-[0.14em] text-ink/50">
              Options are hidden until the timer starts
            </p>
          )}

          {phase === "voting" && (
            <p className="mt-4 text-center text-xs font-bold uppercase tracking-[0.14em] text-ink/50">
              {picked === null
                ? "Tap an option to lock it in"
                : "Locked in — tap another option to change"}
            </p>
          )}

          {phase === "locked" && (
            <p className="mt-4 text-center text-xs font-bold uppercase tracking-[0.14em] text-ink/50">
              Round closed — waiting for the operator's reveal
            </p>
          )}

          {phase === "revealed" && (
            <div className="mt-5 border-t-[3px] border-ink pt-4">
              <div
                className={`border-[3px] border-ink px-4 py-3 ${
                  picked === correct ? "bg-mint" : "bg-sand"
                }`}
              >
                <p className="nb-display text-sm">
                  {picked === correct
                    ? `Star fuelled! +1 ★ → ${me.stars} total`
                    : "No star this round"}
                </p>
                <p className="mt-1 text-sm font-medium text-ink/80">
                  {question.why}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* leaderboard */}
      {roster && roster.length > 0 && (phase === "lobby" || phase === "revealed") && (
        <div className="mt-5 border-[3px] border-ink bg-white shadow-[5px_5px_0_0_#0e0e0e]">
          <div className="border-b-[3px] border-ink bg-ink px-4 py-2">
            <span className="nb-display text-sm text-sun">Star board</span>
          </div>
          <ul className="divide-y-2 divide-ink">
            {roster.slice(0, 5).map((p, i) => (
              <li
                key={p._id}
                className="flex items-center justify-between px-4 py-2.5 text-sm font-bold"
              >
                <span className="flex items-center gap-3">
                  <span className="nb-tag bg-sand">{i + 1}</span>
                  {p.name}
                  {p._id === session.playerId && (
                    <span className="nb-tag bg-cobalt text-white">you</span>
                  )}
                </span>
                <span className="nb-display">★ {p.stars}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* star burst */}
      <AnimatePresence>
        {burst && (
          <motion.div
            key="burst"
            initial={{ opacity: 0, scale: 0.4, rotate: -20 }}
            animate={{ opacity: 1, scale: 1, rotate: 0 }}
            exit={{ opacity: 0, scale: 1.6, rotate: 15 }}
            transition={{ duration: 0.45, ease: "backOut" }}
            className="pointer-events-none fixed inset-x-0 top-1/3 z-50 mx-auto w-fit border-[4px] border-ink bg-sun px-6 py-4 text-center shadow-[8px_8px_0_0_#0e0e0e]"
          >
            <p className="nb-display text-3xl">★ +1 STAR</p>
            <p className="text-xs font-bold uppercase tracking-[0.16em]">
              Fuelled for {me.name}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </PlayerShell>
  );
}

/* ------------------------------------------------------------------ */
/*  page                                                               */
/* ------------------------------------------------------------------ */

export default function Play() {
  const [searchParams, setSearchParams] = useSearchParams();
  const roomParam = (searchParams.get("room") ?? "").trim().toUpperCase();
  const [session, setSession] = useState<PlayerSession | null>(() =>
    loadPlayerSession(),
  );

  const joined =
    session !== null && (!roomParam || session.roomCode === roomParam);

  function handleLeave() {
    clearPlayerSession();
    setSession(null);
  }

  if (!joined) {
    return (
      <PlayerShell>
        <JoinPanel
          defaultRoom={roomParam}
          onJoined={(s) => {
            setSession(s);
            setSearchParams({ room: s.roomCode }, { replace: true });
          }}
        />
      </PlayerShell>
    );
  }

  return <Arena session={session!} onLeave={handleLeave} />;
}
