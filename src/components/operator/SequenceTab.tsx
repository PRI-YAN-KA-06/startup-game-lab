import { motion } from "framer-motion";
import { useMutation, useQuery } from "convex/react";
import { useEffect, useRef, useState } from "react";
import { api } from "@/convex/_generated/api";
import type { Doc } from "@/convex/_generated/dataModel";
import { SEQUENCE_SECONDS } from "@/data/config";
import { SEQ_TOTAL, SEQUENCE_STAGES } from "@/data/sequenceQuestions";
import { useCountdown } from "@/hooks/use-countdown";

const PHASE_LABEL: Record<Doc<"gameRooms">["phase"], string> = {
  lobby: "Lobby",
  question: "Stage live",
  voting: "Clock running",
  locked: "Round locked",
  revealed: "Sequence revealed",
};

const PHASE_STYLE: Record<Doc<"gameRooms">["phase"], string> = {
  lobby: "bg-sand",
  question: "bg-sky",
  voting: "bg-sun",
  locked: "bg-coral text-white",
  revealed: "bg-mint",
};

/**
 * The operator's Game 02 desk — the Sequence Ladder. Same clock-and-reveal
 * loop as Game 01: pick a stage, start the timer, watch the live count of
 * orders in, reveal the correct sequence and fuel the stars.
 */
export function SequenceTab({ room }: { room: Doc<"gameRooms"> }) {
  const players = useQuery(api.game.listPlayers, { roomId: room._id });
  const tally = useQuery(api.game.getSeqTally, {
    roomId: room._id,
    stageIndex: room.seqIndex ?? 0,
  });
  const startStage = useMutation(api.game.startSeqStage);
  const startVoting = useMutation(api.game.startSeqVoting);
  const lockVoting = useMutation(api.game.lockVoting);
  const revealSequence = useMutation(api.game.revealSequence);
  const finishGame = useMutation(api.game.finishGame);

  const seqIndex = room.seqIndex ?? 0;
  const stage = SEQUENCE_STAGES[seqIndex] ?? SEQUENCE_STAGES[0];
  const phase = room.phase;
  const countdown = useCountdown(room.roundStartedAt, room.timerMs);

  const [error, setError] = useState<string | null>(null);
  const [confirmFinish, setConfirmFinish] = useState(false);
  const lockFired = useRef(false);

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

  const answered = tally?.answered ?? 0;
  const seatCount = tally?.players ?? players?.length ?? 0;
  const correctCount = tally?.correctCount ?? 0;
  const timerShare =
    phase === "voting"
      ? countdown.pctLeft
      : seatCount > 0
        ? answered / seatCount
        : 0;

  /* what every device shows — the scrambled display order */
  const displaySteps = stage.order.map((i) => stage.steps[i]);

  return (
    <div className="grid gap-5 xl:grid-cols-[290px_minmax(0,1fr)_320px]">
      {/* ============================ left rail ============================ */}
      <aside className="grid content-start gap-5">
        {/* stage pack */}
        <section className="nb-panel overflow-hidden">
          <div className="flex items-center justify-between border-b-[3px] border-ink bg-sky px-4 py-2.5">
            <span className="nb-display text-sm">Ladder stages</span>
            <span className="nb-tag bg-white">{SEQ_TOTAL}</span>
          </div>
          <div className="grid gap-2 p-3">
            {SEQUENCE_STAGES.map((s, i) => (
              <button
                key={s.id}
                type="button"
                onClick={() =>
                  guard(() => startStage({ roomId: room._id, index: i }))
                }
                className={`flex items-center justify-between border-2 border-ink px-3 py-2 text-left text-sm font-bold transition-transform hover:-translate-y-0.5 ${
                  i === seqIndex
                    ? "bg-ink text-sun"
                    : "bg-white hover:bg-sand"
                }`}
              >
                <span>
                  S{s.stage} · {s.title}
                </span>
                <span className="nb-tag !px-1.5 !py-0.5 !text-[9px] bg-sun text-ink">
                  {s.label}
                </span>
              </button>
            ))}
          </div>
        </section>

        {/* how it works */}
        <section className="nb-panel overflow-hidden">
          <div className="border-b-[3px] border-ink bg-ink px-4 py-2.5">
            <span className="nb-display text-sm text-sun">How it runs</span>
          </div>
          <ul className="grid gap-2 p-4 text-sm font-bold">
            <li className="border-2 border-ink bg-sand px-3 py-2">
              1 · Stage goes live, steps stay hidden
            </li>
            <li className="border-2 border-ink bg-sand px-3 py-2">
              2 · Start the clock — players rebuild the order
            </li>
            <li className="border-2 border-ink bg-sand px-3 py-2">
              3 · Reveal: exact orders bank a star
            </li>
          </ul>
        </section>

        {/* finish the session → releases the report */}
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
              S{seqIndex + 1}/{SEQ_TOTAL}
            </span>
            <span className="nb-tag bg-violet text-white">{stage.label}</span>
            <span className="nb-tag bg-white">{stage.title}</span>
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
                    ? "Steps hidden"
                    : phase === "lobby"
                      ? "Pick a stage"
                      : `${answered}/${seatCount} orders in`}
              </span>
              <span>
                {phase === "voting"
                  ? `${answered}/${seatCount} orders in`
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

        {/* prompt */}
        <div className="border-b-[3px] border-ink p-4 sm:p-5">
          <p className="text-lg font-bold leading-snug sm:text-2xl">
            {stage.prompt}
          </p>
        </div>

        {/* steps (read-only mirror of the player view) */}
        <div className="grid gap-3 p-4 sm:p-5">
          {phase === "lobby" ? (
            <div className="nb-dots grid place-items-center gap-2 border-[3px] border-dashed border-ink/40 py-10 text-center">
              <p className="nb-display text-lg">Stage is empty</p>
              <p className="max-w-sm text-xs font-bold uppercase tracking-[0.12em] text-ink/50">
                Pick a stage from the ladder to put it on every device
              </p>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between">
                <span className="nb-tag bg-sand">
                  Steps as players see them
                </span>
                <span className="nb-tag bg-white">
                  {answered}/{seatCount} orders in
                </span>
              </div>
              <ol className="grid gap-2">
                {displaySteps.map((step, i) => (
                  <li
                    key={`${stage.id}-${i}`}
                    aria-disabled="true"
                    className="flex w-full select-none items-stretch gap-3 border-[3px] border-ink bg-white"
                    style={{ cursor: "not-allowed" }}
                  >
                    <span className="nb-display flex w-11 shrink-0 items-center justify-center border-r-[3px] border-ink bg-sky text-lg sm:w-12 sm:text-xl">
                      {i + 1}
                    </span>
                    <span className="flex-1 px-3 py-3.5 text-sm font-bold leading-snug sm:text-base">
                      {step}
                    </span>
                  </li>
                ))}
              </ol>
            </>
          )}

          {phase === "revealed" && (
            <div className="border-[3px] border-ink bg-mint p-4">
              <p className="nb-display text-sm">Correct sequence</p>
              <ol className="mt-2 grid gap-1.5">
                {stage.steps.map((step, i) => (
                  <li
                    key={`${stage.id}-ok-${i}`}
                    className="flex items-start gap-2 text-sm font-bold"
                  >
                    <span className="nb-tag shrink-0 bg-ink text-white">
                      {i + 1}
                    </span>
                    <span className="pt-0.5">{step}</span>
                  </li>
                ))}
              </ol>
            </div>
          )}

          {phase === "revealed" && (
            <div className="border-[3px] border-ink bg-sand px-4 py-3">
              <p className="nb-display text-sm">Teaching note</p>
              <p className="mt-1 text-sm font-medium text-ink/80">{stage.why}</p>
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
              Select a stage to go live →
            </p>
          )}

          {phase === "question" && (
            <button
              type="button"
              onClick={() =>
                guard(() =>
                  startVoting({
                    roomId: room._id,
                    seconds: SEQUENCE_SECONDS,
                  }),
                )
              }
              className="nb-btn nb-shadow bg-sun text-base"
            >
              ▶ Start {SEQUENCE_SECONDS}s timer
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
              onClick={() => guard(() => revealSequence({ roomId: room._id }))}
              className="nb-btn nb-shadow bg-ink text-sun"
            >
              Show the sequence →
            </button>
          )}

          {phase === "revealed" && (
            <button
              type="button"
              onClick={() =>
                guard(() =>
                  startStage({
                    roomId: room._id,
                    index: (seqIndex + 1) % SEQ_TOTAL,
                  }),
                )
              }
              className="nb-btn nb-shadow bg-mint text-base"
            >
              Next stage →
            </button>
          )}
        </div>
      </section>

      {/* ============================ right rail ============================ */}
      <aside className="grid content-start gap-5">
        {/* live tally */}
        <section className="nb-panel overflow-hidden">
          <div className="flex items-center justify-between border-b-[3px] border-ink bg-ink px-4 py-2.5">
            <span className="nb-display text-sm text-sun">Live tally</span>
            <span className="nb-tag bg-sky text-ink">★ exact order</span>
          </div>
          <div className="grid gap-3 p-4">
            <div className="flex items-end justify-between">
              <span className="nb-display text-5xl leading-none">
                {answered}
                <span className="text-2xl text-ink/50">/{seatCount}</span>
              </span>
              <span className="text-right text-[10px] font-bold uppercase tracking-[0.14em] text-ink/50">
                orders
                <br />
                in
              </span>
            </div>

            <div className="h-7 border-[3px] border-ink bg-white">
              <motion.div
                className="h-full bg-sky"
                initial={false}
                animate={{ width: `${timerShare * 100}%` }}
                transition={{ duration: 0.5, ease: "easeOut" }}
              />
            </div>

            <p className="text-xs font-bold uppercase tracking-[0.12em] text-ink/60">
              {phase === "revealed"
                ? `${correctCount} of ${answered} nailed the order`
                : "Who submitted their arrangement"}
            </p>

            {answered > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {(tally?.names ?? []).map((n) => (
                  <span key={n} className="nb-tag bg-sand">
                    {n}
                  </span>
                ))}
              </div>
            )}

            {phase === "revealed" && (
              <div className="grid gap-1.5 border-t-2 border-dashed border-ink/30 pt-2">
                <div className="flex flex-wrap gap-1.5">
                  {(tally?.correctNames ?? []).map((n) => (
                    <span key={n} className="nb-tag bg-mint">
                      ★ {n}
                    </span>
                  ))}
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {(tally?.wrongNames ?? []).map((n) => (
                    <span key={n} className="nb-tag bg-coral text-white">
                      {n}
                    </span>
                  ))}
                </div>
                {(tally?.correctNames ?? []).length === 0 &&
                  (tally?.wrongNames ?? []).length === 0 && (
                    <span className="nb-tag bg-sand">Nobody ordered it</span>
                  )}
              </div>
            )}
          </div>
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
                      className={`nb-tag ${i === 0 ? "bg-sun" : "bg-sand"}`}
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
