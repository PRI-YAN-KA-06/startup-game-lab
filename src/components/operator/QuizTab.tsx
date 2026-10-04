import { AnimatePresence, motion } from "framer-motion";
import { useMutation, useQuery } from "convex/react";
import { useEffect, useRef, useState } from "react";
import { toDataURL } from "qrcode";
import { api } from "@/convex/_generated/api";
import type { Doc } from "@/convex/_generated/dataModel";
import {
  OPTION_LETTERS,
  OPTION_STYLES,
  PLAYER_PASSCODE,
  QUIZ_TOTAL,
  ROUND_SECONDS,
  playerJoinUrl,
} from "@/data/config";
import { QUIZ_QUESTIONS } from "@/data/quizQuestions";
import { useCountdown } from "@/hooks/use-countdown";

const PHASE_LABEL: Record<Doc<"gameRooms">["phase"], string> = {
  lobby: "Lobby",
  question: "Question live",
  voting: "Voting open",
  locked: "Round locked",
  revealed: "Answer revealed",
};

const PHASE_STYLE: Record<Doc<"gameRooms">["phase"], string> = {
  lobby: "bg-sand",
  question: "bg-sky",
  voting: "bg-sun",
  locked: "bg-coral text-white",
  revealed: "bg-mint",
};

/**
 * The operator's live-quiz desk: QR join panel, the 20-question pack, the
 * clock only they can start, a read-only view of the options with the live
 * tally, the reveal button, and the star-fuel gauge.
 *
 * Operators see everything here but can never tap an option themselves.
 */
export function QuizTab({ room }: { room: Doc<"gameRooms"> }) {
  const players = useQuery(api.game.listPlayers, { roomId: room._id });
  const tally = useQuery(api.game.getTally, {
    roomId: room._id,
    questionIndex: room.questionIndex,
  });
  const startQuestion = useMutation(api.game.startQuestion);
  const startVoting = useMutation(api.game.startVoting);
  const lockVoting = useMutation(api.game.lockVoting);
  const revealAnswer = useMutation(api.game.revealAnswer);
  const resetSession = useMutation(api.game.resetSession);
  const finishGame = useMutation(api.game.finishGame);

  const question =
    QUIZ_QUESTIONS[room.questionIndex] ?? QUIZ_QUESTIONS[0];
  const phase = room.phase;
  const countdown = useCountdown(room.roundStartedAt, room.timerMs);

  const [qr, setQr] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);
  const [confirmFinish, setConfirmFinish] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fuel, setFuel] = useState<{ key: string; count: number } | null>(
    null,
  );
  const lockFired = useRef(false);

  const joinUrl = playerJoinUrl(room.code);

  /* QR for the room */
  useEffect(() => {
    let cancelled = false;
    toDataURL(joinUrl, {
      margin: 1,
      width: 512,
      color: { dark: "#0e0e0e", light: "#ffffff" },
    })
      .then((url) => {
        if (!cancelled) setQr(url);
      })
      .catch(() => {
        if (!cancelled) setQr(null);
      });
    return () => {
      cancelled = true;
    };
  }, [joinUrl]);

  /* the clock hits zero → freeze the tally, exactly like a manual lock */
  useEffect(() => {
    if (phase === "voting" && countdown.expired) {
      if (!lockFired.current) {
        lockFired.current = true;
        lockVoting({ roomId: room._id }).catch(() => undefined);
      }
      return;
    }
    if (phase !== "voting") lockFired.current = false;
  }, [phase, countdown.expired, room._id, lockVoting]);

  async function guard(action: () => Promise<unknown>) {
    setError(null);
    try {
      await action();
    } catch (err) {
      setError(err instanceof Error ? err.message : "That action failed.");
    }
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(joinUrl);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  }

  const answered = tally?.answered ?? 0;
  const seatCount = tally?.players ?? players?.length ?? 0;
  const correctCount = tally?.correctCount ?? 0;
  const fuelShare =
    answered > 0 && phase === "revealed" ? correctCount / answered : 0;
  const timerShare =
    phase === "voting"
      ? countdown.pctLeft
      : seatCount > 0
        ? answered / seatCount
        : 0;

  const correctNames =
    phase === "revealed" && room.correctChoice != null
      ? (tally?.names[room.correctChoice] ?? [])
      : [];

  return (
    <div className="grid gap-5 xl:grid-cols-[290px_minmax(0,1fr)_320px]">
      {/* ============================ left rail ============================ */}
      <aside className="grid content-start gap-5">
        {/* room + QR */}
        <section className="nb-panel overflow-hidden">
          <div className="flex items-center justify-between border-b-[3px] border-ink bg-cobalt px-4 py-2.5 text-white">
            <span className="nb-display text-sm">Room & QR</span>
            <span className="nb-tag bg-mint text-ink">
              {seatCount} joined
            </span>
          </div>
          <div className="grid gap-3 p-4">
            <div className="mx-auto w-full max-w-[210px] border-[3px] border-ink bg-white p-2">
              {qr ? (
                <img
                  src={qr}
                  alt={`QR code to join room ${room.code}`}
                  className="block h-full w-full"
                />
              ) : (
                <div className="nb-dots grid aspect-square place-items-center text-[11px] font-bold uppercase tracking-[0.14em] text-ink/50">
                  Building QR…
                </div>
              )}
            </div>
            <div className="text-center">
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-ink/50">
                Room code
              </p>
              <p className="nb-display text-4xl tracking-[0.3em]">
                {room.code}
              </p>
            </div>
            <button
              type="button"
              onClick={copyLink}
              className="nb-btn !py-2 text-xs"
            >
              {copied ? "Copied ✓" : "Copy join link"}
            </button>
            <div className="border-[3px] border-ink bg-sun px-3 py-2 text-center">
              <p className="text-[10px] font-bold uppercase tracking-[0.14em]">
                Player passcode
              </p>
              <p className="nb-display text-xl">{PLAYER_PASSCODE}</p>
            </div>
          </div>
        </section>

        {/* roster */}
        <section className="nb-panel overflow-hidden">
          <div className="flex items-center justify-between border-b-[3px] border-ink bg-ink px-4 py-2.5">
            <span className="nb-display text-sm text-sun">On the roster</span>
            <span className="nb-tag bg-white text-ink">{seatCount}</span>
          </div>
          {players && players.length > 0 ? (
            <ul className="max-h-56 divide-y-2 divide-ink overflow-y-auto">
              {players.map((p, i) => (
                <li
                  key={p._id}
                  className="flex items-center justify-between px-4 py-2 text-sm font-bold"
                >
                  <span className="flex min-w-0 items-center gap-2">
                    <span className="nb-tag bg-sand">{i + 1}</span>
                    <span className="truncate">{p.name}</span>
                  </span>
                  <span className="nb-display shrink-0 text-sm">★ {p.stars}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="px-4 py-4 text-center text-xs font-bold uppercase tracking-[0.12em] text-ink/50">
              Nobody in yet — show the QR
            </p>
          )}
        </section>

        {/* question pack */}
        <section className="nb-panel overflow-hidden">
          <div className="flex items-center justify-between border-b-[3px] border-ink bg-sun px-4 py-2.5">
            <span className="nb-display text-sm">Question pack</span>
            <span className="nb-tag bg-white">{QUIZ_TOTAL}</span>
          </div>
          <div className="grid grid-cols-5 gap-2 p-3">
            {QUIZ_QUESTIONS.map((q, i) => (
              <button
                key={q.id}
                type="button"
                title={`Q${i + 1} · ${q.concept}`}
                onClick={() =>
                  guard(() =>
                    startQuestion({ roomId: room._id, index: i }),
                  )
                }
                className={`aspect-square border-2 border-ink text-sm font-bold transition-transform hover:-translate-y-0.5 ${
                  i === room.questionIndex
                    ? "bg-ink text-sun"
                    : "bg-white hover:bg-sand"
                }`}
              >
                {i + 1}
              </button>
            ))}
          </div>
        </section>

        <button
          type="button"
          onClick={() => {
            if (!confirmReset) {
              setConfirmReset(true);
              window.setTimeout(() => setConfirmReset(false), 3500);
              return;
            }
            setConfirmReset(false);
            guard(() => resetSession({ roomId: room._id }));
          }}
          className={`nb-btn w-full text-xs ${
            confirmReset ? "bg-coral text-white" : "bg-white"
          }`}
        >
          {confirmReset
            ? "Tap again to wipe all stars"
            : "Reset session & stars"}
        </button>

        {/* end the session → the Q&A report unlocks on every player device */}
        <button
          type="button"
          onClick={() => {
            if (!confirmFinish) {
              setConfirmFinish(true);
              window.setTimeout(() => setConfirmFinish(false), 3500);
              return;
            }
            setConfirmFinish(false);
            guard(() => finishGame({ roomId: room._id }));
          }}
          className={`nb-btn w-full text-xs ${
            room.finished
              ? "bg-mint"
              : confirmFinish
                ? "bg-coral text-white"
                : "bg-white"
          }`}
        >
          {room.finished
            ? "✓ Report released to players"
            : confirmFinish
              ? "Tap again to end the session"
              : "End game · release Q&A report"}
        </button>
      </aside>

      {/* ============================ stage ============================ */}
      <section className="grid content-start gap-0 self-start border-[3px] border-ink bg-white shadow-[6px_6px_0_0_#0e0e0e]">
        {/* header */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-b-[3px] border-ink px-4 py-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className={`nb-tag ${PHASE_STYLE[phase]}`}>
              {PHASE_LABEL[phase]}
            </span>
            <span className="nb-tag bg-sand">
              Q{room.questionIndex + 1}/{QUIZ_TOTAL}
            </span>
            <span className="nb-tag bg-violet text-white">
              {question.concept}
            </span>
            <span className="nb-tag bg-white">{question.kind}</span>
          </div>
          <span className="nb-tag bg-ink text-white">
            Operator view · taps disabled
          </span>
        </div>

        {/* clock strip */}
        <div className="grid gap-2 border-b-[3px] border-ink bg-ink px-4 py-3 sm:grid-cols-[auto_minmax(0,1fr)] sm:items-center sm:gap-4">
          <span
            className={`nb-display text-4xl leading-none ${
              phase === "voting" && countdown.secondsLeft <= 3
                ? "text-coral"
                : "text-sun"
            }`}
          >
            {phase === "voting"
              ? `${countdown.secondsLeft}s`
              : phase === "locked" || phase === "revealed"
                ? "0s"
                : "--"}
          </span>
          <div>
            <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-[0.16em] text-white/70">
              <span>
                {phase === "voting"
                  ? "Clock running"
                  : phase === "question"
                    ? "Options hidden"
                    : phase === "lobby"
                      ? "Pick a question"
                      : `${answered}/${seatCount} answered`}
              </span>
              <span>
                {phase === "voting"
                  ? `${answered}/${seatCount} answered`
                  : PHASE_LABEL[phase]}
              </span>
            </div>
            <div className="mt-1.5 h-4 border-2 border-white bg-ink">
              <div
                className="h-full bg-sun transition-[width] duration-150 ease-linear"
                style={{ width: `${Math.max(0, Math.min(1, timerShare)) * 100}%` }}
              />
            </div>
          </div>
        </div>

        {/* question */}
        <div className="border-b-[3px] border-ink p-4 sm:p-5">
          <p className="text-lg font-bold leading-snug sm:text-2xl">
            {question.prompt}
          </p>
        </div>

        {/* options + live tally (read-only) */}
        <div className="grid gap-3 p-4 sm:p-5">
          {phase === "lobby" ? (
            <div className="nb-dots grid place-items-center gap-2 border-[3px] border-dashed border-ink/40 py-10 text-center">
              <p className="nb-display text-lg">Stage is empty</p>
              <p className="max-w-sm text-xs font-bold uppercase tracking-[0.12em] text-ink/50">
                Pick a question from the pack to put it on every device
              </p>
            </div>
          ) : (
            question.options.map((opt, i) => {
              const count = tally?.counts[i] ?? 0;
              const share = answered > 0 ? count / answered : 0;
              const names = tally?.names[i] ?? [];
              const revealed = phase === "revealed";
              const isCorrect = revealed && room.correctChoice === i;
              return (
                <div
                  key={i}
                  aria-disabled="true"
                  className={`relative flex w-full select-none items-stretch gap-3 overflow-hidden border-[3px] border-ink ${OPTION_STYLES[i]} ${
                    isCorrect ? "shadow-[0_0_0_4px_#0e0e0e]" : ""
                  }`}
                  style={{ cursor: "not-allowed" }}
                >
                  <div
                    className="absolute inset-y-0 left-0 bg-white/70 transition-[width] duration-300"
                    style={{ width: `${share * 100}%` }}
                  />
                  <span className="nb-display relative z-10 flex w-11 shrink-0 items-center justify-center border-r-[3px] border-ink bg-white text-lg sm:w-12 sm:text-xl">
                    {OPTION_LETTERS[i]}
                  </span>
                  <div className="relative z-10 min-w-0 flex-1 py-3 pr-2">
                    <p className="text-sm font-bold leading-snug sm:text-base">
                      {opt}
                    </p>
                    {names.length > 0 && (
                      <p className="mt-1 truncate text-[11px] font-semibold text-ink/70">
                        {names.slice(0, 6).join(", ")}
                        {names.length > 6 ? ` +${names.length - 6}` : ""}
                      </p>
                    )}
                    {isCorrect && (
                      <span className="nb-tag mt-2 bg-ink text-white">
                        ✓ Correct answer
                      </span>
                    )}
                  </div>
                  <span className="nb-display relative z-10 flex w-14 shrink-0 items-center justify-center border-l-[3px] border-ink bg-white text-2xl">
                    {count}
                  </span>
                </div>
              );
            })
          )}

          {phase === "revealed" && (
            <div className="border-[3px] border-ink bg-sand px-4 py-3">
              <p className="nb-display text-sm">Teaching note</p>
              <p className="mt-1 text-sm font-medium text-ink/80">
                {question.why}
              </p>
            </div>
          )}

          {error && (
            <p className="border-[3px] border-ink bg-coral px-3 py-2 text-sm font-bold text-white">
              {error}
            </p>
          )}
        </div>

        {/* controls */}
        <div className="flex flex-wrap items-center gap-3 border-t-[3px] border-ink bg-sand p-4">
          {phase === "lobby" && (
            <p className="text-xs font-bold uppercase tracking-[0.12em] text-ink/60">
              Select a question to go live →
            </p>
          )}

          {phase === "question" && (
            <button
              type="button"
              onClick={() =>
                guard(() =>
                  startVoting({ roomId: room._id, seconds: ROUND_SECONDS }),
                )
              }
              className="nb-btn nb-shadow bg-sun text-base"
            >
              ▶ Start {ROUND_SECONDS}s timer
            </button>
          )}

          {phase === "voting" && (
            <>
              <button
                type="button"
                onClick={() => guard(() => lockVoting({ roomId: room._id }))}
                className="nb-btn bg-white text-sm"
              >
                Lock round now
              </button>
              <span className="nb-tag animate-pulse bg-coral text-white">
                Clock running
              </span>
            </>
          )}

          {(phase === "locked" || phase === "voting") && (
            <button
              type="button"
              onClick={() =>
                guard(async () => {
                  // stars for this round, counted the moment the reveal lands
                  const count = tally?.counts[question.correct] ?? 0;
                  await revealAnswer({
                    roomId: room._id,
                    correctChoice: question.correct,
                  });
                  if (count > 0) {
                    const key = String(room.questionIndex);
                    setFuel({ key, count });
                    window.setTimeout(() => {
                      setFuel((current) =>
                        current && current.key === key ? null : current,
                      );
                    }, 3800);
                  }
                })
              }
              className="nb-btn nb-shadow bg-ink text-sun"
            >
              What's the answer? →
            </button>
          )}

          {phase === "revealed" && (
            <button
              type="button"
              onClick={() =>
                guard(() =>
                  startQuestion({
                    roomId: room._id,
                    index: (room.questionIndex + 1) % QUIZ_TOTAL,
                  }),
                )
              }
              className="nb-btn nb-shadow bg-mint text-base"
            >
              Next question →
            </button>
          )}

          <div className="ml-auto flex gap-2">
            <button
              type="button"
              onClick={() =>
                guard(() =>
                  startQuestion({
                    roomId: room._id,
                    index:
                      (room.questionIndex - 1 + QUIZ_TOTAL) % QUIZ_TOTAL,
                  }),
                )
              }
              className="nb-btn !py-2 text-xs"
            >
              ← Prev
            </button>
            {phase !== "revealed" && (
              <button
                type="button"
                onClick={() =>
                  guard(() =>
                    startQuestion({
                      roomId: room._id,
                      index: (room.questionIndex + 1) % QUIZ_TOTAL,
                    }),
                  )
                }
                className="nb-btn !py-2 text-xs"
              >
                Skip →
              </button>
            )}
          </div>
        </div>
      </section>

      {/* ============================ right rail ============================ */}
      <aside className="grid content-start gap-5">
        {/* star fuel */}
        <section className="nb-panel relative overflow-hidden">
          <div className="flex items-center justify-between border-b-[3px] border-ink bg-ink px-4 py-2.5">
            <span className="nb-display text-sm text-sun">Round fuel</span>
            <span className="nb-tag bg-sun text-ink">★ per question</span>
          </div>
          <div className="grid gap-3 p-4">
            <div className="flex items-end justify-between">
              <span className="nb-display text-5xl leading-none">
                ★ {phase === "revealed" ? correctCount : "—"}
              </span>
              <span className="text-right text-[10px] font-bold uppercase tracking-[0.14em] text-ink/50">
                this
                <br />
                round
              </span>
            </div>

            <div className="h-7 border-[3px] border-ink bg-white">
              <motion.div
                className="h-full bg-sun"
                initial={false}
                animate={{ width: `${fuelShare * 100}%` }}
                transition={{ duration: 0.7, ease: "easeOut" }}
                style={{
                  backgroundImage:
                    "repeating-linear-gradient(-45deg, rgba(14,14,14,0.16) 0 8px, transparent 8px 16px)",
                }}
              />
            </div>

            <p className="text-xs font-bold uppercase tracking-[0.12em] text-ink/60">
              {phase === "revealed"
                ? `${correctCount} of ${answered} players fuelled up`
                : "Fills when the answer is revealed"}
            </p>

            {phase === "revealed" && (
              <div className="flex flex-wrap gap-1.5">
                {correctNames.length > 0 ? (
                  correctNames.map((n) => (
                    <span key={n} className="nb-tag bg-mint">
                      ★ {n}
                    </span>
                  ))
                ) : (
                  <span className="nb-tag bg-sand">No correct picks yet</span>
                )}
              </div>
            )}
          </div>

          {/* stars flying into the gauge */}
          <AnimatePresence>
            {fuel && (
              <motion.div
                key={fuel.key}
                className="pointer-events-none absolute inset-0 grid place-items-center"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0, transition: { duration: 0.4 } }}
              >
                <div className="relative h-40 w-full">
                  {Array.from({ length: Math.min(Math.max(fuel.count, 1), 9) }).map(
                    (_, i, arr) => (
                      <motion.span
                        key={i}
                        className="nb-display absolute left-1/2 top-1/2 text-4xl text-sun"
                        style={{ WebkitTextStroke: "2px #0e0e0e" }}
                        initial={{ x: -150, y: 110, opacity: 0, rotate: -50 }}
                        animate={{
                          x: (i - (arr.length - 1) / 2) * 30,
                          y: -18,
                          opacity: 1,
                          rotate: 0,
                        }}
                        transition={{
                          delay: i * 0.09,
                          type: "spring",
                          stiffness: 140,
                          damping: 14,
                        }}
                      >
                        ★
                      </motion.span>
                    ),
                  )}
                  <motion.span
                    className="nb-display absolute bottom-3 left-1/2 -translate-x-1/2 border-[3px] border-ink bg-ink px-3 py-1 text-sm text-sun"
                    initial={{ scale: 0, rotate: -8 }}
                    animate={{ scale: 1, rotate: -3 }}
                    transition={{ delay: 0.35, type: "spring", stiffness: 200 }}
                  >
                    Fuel up +{fuel.count} ★
                  </motion.span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </section>

        {/* leaderboard */}
        <section className="nb-panel overflow-hidden">
          <div className="flex items-center justify-between border-b-[3px] border-ink bg-violet px-4 py-2.5 text-white">
            <span className="nb-display text-sm">Star board</span>
            <span className="nb-tag bg-sun text-ink">Live</span>
          </div>
          {players && players.length > 0 ? (
            <ol className="divide-y-2 divide-ink">
              {players.slice(0, 8).map((p, i) => (
                <li
                  key={p._id}
                  className="flex items-center justify-between px-4 py-2.5 text-sm font-bold"
                >
                  <span className="flex min-w-0 items-center gap-2">
                    <span
                      className={`nb-tag ${
                        i === 0 ? "bg-sun" : "bg-sand"
                      }`}
                    >
                      {i + 1}
                    </span>
                    <span className="truncate">{p.name}</span>
                  </span>
                  <span className="nb-display shrink-0">★ {p.stars}</span>
                </li>
              ))}
            </ol>
          ) : (
            <p className="px-4 py-5 text-center text-xs font-bold uppercase tracking-[0.12em] text-ink/50">
              Stars land here once players join
            </p>
          )}
        </section>
      </aside>
    </div>
  );
}
