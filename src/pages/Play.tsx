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
  SEQUENCE_SECONDS,
} from "@/data/config";
import { QUIZ_QUESTIONS } from "@/data/quizQuestions";
import { SEQ_TOTAL, SEQUENCE_STAGES } from "@/data/sequenceQuestions";
import { useCountdown } from "@/hooks/use-countdown";
import {
  clearPlayerSession,
  loadPlayerSession,
  type PlayerSession,
} from "@/lib/player-session";
import { downloadReport } from "@/lib/report";

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
  const submitSequence = useMutation(api.game.submitSequence);

  const [picks, setPicks] = useState<Record<number, number>>({});
  const [errors, setErrors] = useState<Record<number, string>>({});
  const [burst, setBurst] = useState(false);
  // Game 02 sequence ladder — drafts & submissions keyed by stage index
  const [seqDrafts, setSeqDrafts] = useState<Record<number, number[]>>({});
  const [seqSubmitted, setSeqSubmitted] = useState<Record<number, number[]>>({});
  const [seqErrors, setSeqErrors] = useState<Record<number, string>>({});
  const [buildingReport, setBuildingReport] = useState(false);
  const prevStars = useRef<number | null>(null);

  const phase = room?.phase;
  const questionIndex = room?.questionIndex ?? 0;
  const question = QUIZ_QUESTIONS[questionIndex] ?? QUIZ_QUESTIONS[0];
  const countdown = useCountdown(room?.roundStartedAt, room?.timerMs);

  // which game is on screen — Game 01 quiz or Game 02 sequence ladder
  const isSeq = room?.mode === "sequence";
  const seqIndex = room?.seqIndex ?? 0;
  const seqStage = SEQUENCE_STAGES[seqIndex] ?? SEQUENCE_STAGES[0];

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

  /* ---------- Game 02: arrangement helpers ---------- */

  function placeStep(stepIdx: number) {
    if (!room || phase !== "voting") return;
    setSeqDrafts((prev) => {
      const current = prev[seqIndex] ?? [];
      if (
        current.includes(stepIdx) ||
        current.length >= seqStage.steps.length
      ) {
        return prev;
      }
      return { ...prev, [seqIndex]: [...current, stepIdx] };
    });
  }

  function pullStep(stepIdx: number) {
    if (!room || phase !== "voting") return;
    setSeqDrafts((prev) => ({
      ...prev,
      [seqIndex]: (prev[seqIndex] ?? []).filter((i) => i !== stepIdx),
    }));
  }

  async function submitOrder() {
    if (!room) return;
    const order = seqDrafts[seqIndex] ?? [];
    setSeqErrors((prev) => {
      if (!(seqIndex in prev)) return prev;
      const next = { ...prev };
      delete next[seqIndex];
      return next;
    });
    try {
      await submitSequence({
        roomId: room._id,
        playerId: session.playerId,
        order,
      });
      setSeqSubmitted((prev) => ({ ...prev, [seqIndex]: order }));
    } catch (err) {
      setSeqErrors((prev) => ({
        ...prev,
        [seqIndex]:
          err instanceof Error ? err.message : "Could not send your order.",
      }));
    }
  }

  function grabReport() {
    setBuildingReport(true);
    try {
      downloadReport();
    } finally {
      setBuildingReport(false);
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

  const nSteps = seqStage.steps.length;
  const seqDraft = seqDrafts[seqIndex] ?? [];
  const seqSubmission = seqSubmitted[seqIndex] ?? null;
  const seqRemaining = seqStage.order.filter((i) => !seqDraft.includes(i));
  const seqLockedIn =
    seqSubmission !== null &&
    seqSubmission.length === seqDraft.length &&
    seqSubmission.every((v, i) => v === seqDraft[i]);
  const seqMatched =
    seqDraft.length === nSteps && seqDraft.every((v, i) => v === i);
  const seqErr = seqErrors[seqIndex] ?? null;

  return (
    <PlayerShell session={session} onLeave={onLeave}>
      {/* status strip */}
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3 border-[3px] border-ink bg-white px-4 py-3 shadow-[5px_5px_0_0_#0e0e0e]">
        <div className="flex items-center gap-3">
          <span className="nb-tag bg-cobalt text-white">{me.name}</span>
          {isSeq ? (
            <span className="nb-tag bg-sand">
              S{seqIndex + 1}/{SEQ_TOTAL}
            </span>
          ) : (
            <span className="nb-tag bg-sand">
              Q{questionIndex + 1}/{QUIZ_TOTAL}
            </span>
          )}
          {totalAnswered > 0 && (
            <span className="nb-tag bg-mint">{totalAnswered} in room</span>
          )}
        </div>
        <div className="nb-tag bg-ink text-base text-white">
          ★ <span className="text-sun">{me.stars}</span> stars
        </div>
      </div>

      {/* end of session → the Q&A report unlocks right here */}
      {room.finished && (
        <div className="mb-5 border-[3px] border-ink bg-sun shadow-[5px_5px_0_0_#0e0e0e]">
          <div className="flex items-center justify-between border-b-[3px] border-ink px-4 py-2.5">
            <span className="nb-display text-base">Game complete</span>
            <span className="nb-tag bg-ink text-white">★ {me.stars} final</span>
          </div>
          <div className="grid gap-3 p-4">
            <p className="text-sm font-medium leading-relaxed text-ink/80">
              Nice work, {me.name} — the session is wrapped. Take the full
              Q&A report home: every prompt, every answer, every teaching
              note.
            </p>
            <button
              type="button"
              onClick={grabReport}
              className="nb-btn nb-shadow bg-ink text-white"
            >
              {buildingReport
                ? "Building your PDF…"
                : "Download Q&A report (PDF)"}
            </button>
            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-ink/60">
              {QUIZ_TOTAL} situation questions + {SEQ_TOTAL} sequence stages
            </p>
          </div>
        </div>
      )}

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
        {isSeq ? (
          <div className="flex items-center justify-between border-b-[3px] border-ink bg-sky px-4 py-2.5">
            <span className="nb-tag bg-white text-ink">Sequence</span>
            <span className="nb-display text-sm">
              {seqStage.label} · {seqStage.title}
            </span>
          </div>
        ) : (
          <div className="flex items-center justify-between border-b-[3px] border-ink bg-violet px-4 py-2.5 text-white">
            <span className="nb-tag bg-white text-ink">{question.kind}</span>
            <span className="nb-display text-sm">{question.concept}</span>
          </div>
        )}

        <div className="p-5">
          <p className="text-lg font-bold leading-snug sm:text-xl">
            {isSeq ? seqStage.prompt : question.prompt}
          </p>

          {/* ---------- Game 02: sequence board ---------- */}
          {isSeq && (
            <div className="mt-5 grid gap-4">
              {phase === "lobby" && (
                <div className="grid place-items-center gap-3 py-8 text-center">
                  <BulbIcon
                    className="h-16 w-16"
                    style={{ animation: "nb-float 3s ease-in-out infinite" }}
                  />
                  <p className="nb-display text-lg">You're in, {me.name}</p>
                  <p className="max-w-xs text-sm font-medium text-ink/70">
                    Waiting for the operator to load stage 1 of the ladder…
                  </p>
                </div>
              )}

              {phase === "question" && (
                <div className="grid place-items-center gap-3 py-8 text-center">
                  <div className="flex gap-2">
                    {[0, 1, 2].map((i) => (
                      <span
                        key={i}
                        className="h-4 w-4 border-2 border-ink bg-sky"
                        style={{
                          animation: `nb-float 1s ease-in-out ${i * 0.18}s infinite`,
                        }}
                      />
                    ))}
                  </div>
                  <p className="nb-display text-lg">Order matters.</p>
                  <p className="max-w-xs text-sm font-medium text-ink/70">
                    The steps land on your screen the second the operator
                    starts the {SEQUENCE_SECONDS}s clock — then you rebuild
                    the sequence.
                  </p>
                </div>
              )}

              {(phase === "voting" || phase === "locked") && (
                <div className="grid gap-4 sm:grid-cols-2">
                  {/* your order */}
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="nb-tag bg-ink text-white">
                        Your order
                      </span>
                      <span className="nb-tag bg-sand">
                        {seqDraft.length}/{nSteps}
                      </span>
                    </div>
                    <ol className="mt-2 grid gap-2">
                      {seqDraft.map((stepIdx, pos) => (
                        <li key={stepIdx}>
                          <button
                            type="button"
                            onClick={() => pullStep(stepIdx)}
                            disabled={phase !== "voting"}
                            className={`flex w-full items-stretch gap-3 border-[3px] border-ink bg-mint text-left transition-all duration-150 ${
                              phase === "voting"
                                ? "hover:-translate-y-0.5"
                                : "cursor-not-allowed"
                            }`}
                          >
                            <span className="nb-display flex w-10 shrink-0 items-center justify-center border-r-[3px] border-ink bg-white text-lg">
                              {pos + 1}
                            </span>
                            <span className="flex-1 px-3 py-3 text-sm font-bold leading-snug">
                              {seqStage.steps[stepIdx]}
                            </span>
                            {phase === "voting" && (
                              <span className="nb-display flex w-9 shrink-0 items-center justify-center border-l-[3px] border-ink bg-white text-lg">
                                ✕
                              </span>
                            )}
                          </button>
                        </li>
                      ))}
                      {Array.from({
                        length: Math.max(0, nSteps - seqDraft.length),
                      }).map((_, i) => (
                        <li
                          key={`slot-${i}`}
                          className="flex items-center gap-3 border-[3px] border-dashed border-ink/40 px-3 py-3.5 text-xs font-bold uppercase tracking-[0.14em] text-ink/40"
                        >
                          {seqDraft.length + i + 1} · next step
                        </li>
                      ))}
                    </ol>

                    {phase === "voting" && seqDraft.length === nSteps && (
                      <button
                        type="button"
                        onClick={() => void submitOrder()}
                        disabled={seqLockedIn}
                        className={`nb-btn nb-shadow mt-3 w-full text-sm ${
                          seqLockedIn ? "bg-mint" : "bg-cobalt text-white"
                        }`}
                      >
                        {seqLockedIn
                          ? "✓ Order locked in"
                          : "Lock in my order →"}
                      </button>
                    )}
                    {phase === "voting" && seqDraft.length < nSteps && (
                      <p className="mt-3 text-center text-xs font-bold uppercase tracking-[0.14em] text-ink/50">
                        Place every step, then lock it in
                      </p>
                    )}
                  </div>

                  {/* available steps */}
                  <div>
                    <span className="nb-tag bg-sky">Available steps</span>
                    <div className="mt-2 grid gap-2">
                      {seqRemaining.map((stepIdx) => (
                        <button
                          key={stepIdx}
                          type="button"
                          onClick={() => placeStep(stepIdx)}
                          disabled={phase !== "voting"}
                          className="flex w-full items-stretch gap-3 border-[3px] border-ink bg-white text-left transition-all duration-150 hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          <span className="nb-display flex w-10 shrink-0 items-center justify-center border-r-[3px] border-ink bg-sky text-lg">
                            {seqStage.order.indexOf(stepIdx) + 1}
                          </span>
                          <span className="flex-1 px-3 py-3 text-sm font-bold leading-snug">
                            {seqStage.steps[stepIdx]}
                          </span>
                        </button>
                      ))}
                      {seqRemaining.length === 0 && (
                        <p className="border-[3px] border-dashed border-ink/40 px-3 py-4 text-center text-xs font-bold uppercase tracking-[0.14em] text-ink/50">
                          Every step placed — check your order
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {phase === "revealed" && (
                <div className="grid gap-4">
                  <div
                    className={`border-[3px] border-ink px-4 py-3 ${
                      seqMatched ? "bg-mint" : "bg-sand"
                    }`}
                  >
                    <p className="nb-display text-sm">
                      {seqMatched
                        ? `Star fuelled! +1 ★ → ${me.stars} total`
                        : "No star this round"}
                    </p>
                    <p className="mt-1 text-sm font-medium text-ink/80">
                      {seqStage.why}
                    </p>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <span className="nb-tag bg-ink text-white">
                        Your order
                      </span>
                      <ol className="mt-2 grid gap-1.5">
                        {seqDraft.length === 0 && (
                          <li className="border-[3px] border-dashed border-ink/40 px-3 py-3 text-xs font-bold uppercase tracking-[0.14em] text-ink/50">
                            No order locked in
                          </li>
                        )}
                        {seqDraft.map((stepIdx, pos) => (
                          <li
                            key={`mine-${stepIdx}`}
                            className={`flex items-start gap-2 border-2 border-ink px-2.5 py-2 text-sm font-bold ${
                              stepIdx === pos
                                ? "bg-mint"
                                : "bg-coral text-white"
                            }`}
                          >
                            <span className="nb-tag shrink-0 bg-white text-ink">
                              {pos + 1}
                            </span>
                            <span className="pt-0.5">
                              {seqStage.steps[stepIdx]}
                            </span>
                          </li>
                        ))}
                      </ol>
                    </div>
                    <div>
                      <span className="nb-tag bg-sun">Correct sequence</span>
                      <ol className="mt-2 grid gap-1.5">
                        {seqStage.steps.map((step, i) => (
                          <li
                            key={`ok-${i}`}
                            className="flex items-start gap-2 border-2 border-ink bg-white px-2.5 py-2 text-sm font-bold"
                          >
                            <span className="nb-tag shrink-0 bg-ink text-white">
                              {i + 1}
                            </span>
                            <span className="pt-0.5">{step}</span>
                          </li>
                        ))}
                      </ol>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ---------- Game 01: option board ---------- */}
          {!isSeq && (
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
          )}

          {seqErr && (
            <p className="mt-4 border-[3px] border-ink bg-coral px-3 py-2 text-sm font-bold text-white">
              {seqErr}
            </p>
          )}

          {error && (
            <p className="mt-4 border-[3px] border-ink bg-coral px-3 py-2 text-sm font-bold text-white">
              {error}
            </p>
          )}

          {!isSeq && phase === "question" && (
            <p className="mt-4 border-[3px] border-dashed border-ink/40 px-3 py-2 text-center text-xs font-bold uppercase tracking-[0.14em] text-ink/50">
              Options are hidden until the timer starts
            </p>
          )}

          {isSeq && phase === "question" && (
            <p className="mt-4 border-[3px] border-dashed border-ink/40 px-3 py-2 text-center text-xs font-bold uppercase tracking-[0.14em] text-ink/50">
              Steps are hidden until the timer starts
            </p>
          )}

          {isSeq && phase === "voting" && (
            <p className="mt-4 text-center text-xs font-bold uppercase tracking-[0.14em] text-ink/50">
              {seqDraft.length < nSteps
                ? "Tap steps top to bottom to build your sequence"
                : seqLockedIn
                  ? "Locked in — tap a step to pull it back out"
                  : "All placed — lock your order in"}
            </p>
          )}

          {isSeq && phase === "locked" && (
            <p className="mt-4 text-center text-xs font-bold uppercase tracking-[0.14em] text-ink/50">
              {seqSubmission
                ? "Round closed — waiting for the operator's reveal"
                : "Round closed with no order locked in"}
            </p>
          )}

          {!isSeq && phase === "voting" && (
            <p className="mt-4 text-center text-xs font-bold uppercase tracking-[0.14em] text-ink/50">
              {picked === null
                ? "Tap an option to lock it in"
                : "Locked in — tap another option to change"}
            </p>
          )}

          {!isSeq && phase === "locked" && (
            <p className="mt-4 text-center text-xs font-bold uppercase tracking-[0.14em] text-ink/50">
              Round closed — waiting for the operator's reveal
            </p>
          )}

          {!isSeq && phase === "revealed" && (
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
      {roster && roster.length > 0 &&
        (phase === "lobby" || phase === "revealed" || room.finished) && (
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
