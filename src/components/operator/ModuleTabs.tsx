import { Lock, Star } from "lucide-react";
import { QUIZ_TOTAL } from "@/data/config";
import { QUIZ_QUESTIONS } from "@/data/quizQuestions";

const STAGES = [
  { n: 1, label: "Easy", title: "Idea → Incorporation", tint: "bg-mint" },
  { n: 2, label: "Warm-up", title: "Build the MVP", tint: "bg-sun" },
  { n: 3, label: "Medium", title: "First customers", tint: "bg-tang" },
  { n: 4, label: "Hard", title: "Seed & dilution", tint: "bg-coral" },
  { n: 5, label: "Brutal", title: "Crisis calls", tint: "bg-violet text-white" },
];

/** Game 02 — the rearrange-the-sequence ladder. Nav slot reserved in v1. */
export function SequenceTab() {
  return (
    <div className="grid gap-5">
      <section className="border-[3px] border-ink bg-white shadow-[6px_6px_0_0_#0e0e0e]">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b-[3px] border-ink bg-sky px-4 py-3">
          <span className="nb-display text-lg">Game 02 · Sequence ladder</span>
          <span className="nb-tag bg-ink text-white">Next build</span>
        </div>
        <div className="grid gap-4 p-5 lg:grid-cols-[1.4fr_1fr] lg:items-center">
          <div>
            <h2 className="nb-display text-2xl sm:text-3xl">
              Put the startup in order
            </h2>
            <p className="mt-3 max-w-xl text-sm font-medium leading-relaxed text-ink/75">
              Players drag-and-drop a scrambled set of steps into the correct
              sequence: how you actually form a startup, raise, and survive.
              The operator runs the same clock-and-reveal loop as the quiz —
              five stages climb from easy to difficult.
            </p>
          </div>
          <div className="border-[3px] border-ink bg-sand p-4">
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-ink/60">
              Operator controls, same as Game 01
            </p>
            <ul className="mt-2 grid gap-2 text-sm font-bold">
              <li className="border-2 border-ink bg-white px-3 py-2">
                Start / lock the round
              </li>
              <li className="border-2 border-ink bg-white px-3 py-2">
                Live correct-order tally
              </li>
              <li className="border-2 border-ink bg-white px-3 py-2">
                Reveal + star fuel
              </li>
            </ul>
          </div>
        </div>
      </section>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {STAGES.map((s) => (
          <div
            key={s.n}
            className="border-[3px] border-ink bg-white shadow-[6px_6px_0_0_#0e0e0e]"
          >
            <div
              className={`flex items-center justify-between border-b-[3px] border-ink px-3 py-2 ${s.tint}`}
            >
              <span className="nb-display text-lg">Stage {s.n}</span>
              <Lock className="size-4" />
            </div>
            <div className="p-3">
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-ink/50">
                {s.label}
              </p>
              <p className="nb-display mt-1 text-sm">{s.title}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/** Notes tab — the Q&A report that ships with the pack. Nav slot reserved in v1. */
export function NotesTab() {
  return (
    <div className="grid gap-5">
      <section className="border-[3px] border-ink bg-white shadow-[6px_6px_0_0_#0e0e0e]">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b-[3px] border-ink bg-coral px-4 py-3 text-white">
          <span className="nb-display text-lg">Notes · Q&A report</span>
          <span className="nb-tag bg-ink text-white">Next build</span>
        </div>
        <div className="grid gap-5 p-5 lg:grid-cols-[1fr_1.1fr]">
          <div>
            <h2 className="nb-display text-2xl sm:text-3xl">
              Every question, every answer — as a PDF
            </h2>
            <p className="mt-3 text-sm font-medium leading-relaxed text-ink/75">
              After the round, players download the full {QUIZ_TOTAL}-question
              report: prompt, correct option and the teaching note for each —
              a revision sheet they keep after the event.
            </p>
            <button
              type="button"
              disabled
              className="nb-btn mt-5 bg-sand text-sm"
            >
              <Lock className="size-4" /> Download PDF — unlocking next
            </button>
          </div>

          {/* sheet preview */}
          <div className="relative border-[3px] border-ink bg-sand p-4">
            <div className="border-[3px] border-ink bg-white p-4 shadow-[4px_4px_0_0_#0e0e0e]">
              <div className="flex items-center justify-between border-b-2 border-ink pb-2">
                <span className="nb-display text-xs">
                  Startup School · Q&A Report
                </span>
                <span className="nb-tag bg-sun">{QUIZ_TOTAL} questions</span>
              </div>
              <ol className="mt-3 grid gap-2.5">
                {QUIZ_QUESTIONS.slice(0, 4).map((q) => (
                  <li key={q.id} className="text-[11px] leading-snug">
                    <p className="font-bold">
                      Q{q.id}. {q.prompt.slice(0, 78)}
                      {q.prompt.length > 78 ? "…" : ""}
                    </p>
                    <p className="mt-0.5 flex items-center gap-1 font-bold text-ink/70">
                      <Star className="size-3 fill-sun text-ink" />
                      {q.options[q.correct]}
                    </p>
                  </li>
                ))}
                <li className="flex items-center gap-2 border-t-2 border-dashed border-ink/30 pt-2 text-[11px] font-bold text-ink/50">
                  … {QUIZ_TOTAL - 4} more answers in the full report
                </li>
              </ol>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
