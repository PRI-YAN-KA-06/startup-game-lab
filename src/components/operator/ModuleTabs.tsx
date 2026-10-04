import { Download } from "lucide-react";
import { QUIZ_TOTAL } from "@/data/config";
import { QUIZ_QUESTIONS } from "@/data/quizQuestions";
import { SEQ_TOTAL } from "@/data/sequenceQuestions";
import { downloadReport } from "@/lib/report";

/** Notes tab — the Q&A report that ships with the pack. */
export function NotesTab() {
  return (
    <div className="grid gap-5">
      <section className="border-[3px] border-ink bg-white shadow-[6px_6px_0_0_#0e0e0e]">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b-[3px] border-ink bg-coral px-4 py-3 text-white">
          <span className="nb-display text-lg">Notes · Q&A report</span>
          <span className="nb-tag bg-ink text-white">Ready</span>
        </div>
        <div className="grid gap-5 p-5 lg:grid-cols-[1fr_1.1fr]">
          <div>
            <h2 className="nb-display text-2xl sm:text-3xl">
              Every question, every answer — as a PDF
            </h2>
            <p className="mt-3 text-sm font-medium leading-relaxed text-ink/75">
              The full report: all {QUIZ_TOTAL} situation questions with their
              correct answers and teaching notes, plus all {SEQ_TOTAL} sequence
              stages with the right order. The same file unlocks on every
              player device the moment you end the game.
            </p>
            <button
              type="button"
              onClick={downloadReport}
              className="nb-btn nb-shadow mt-5 bg-sun text-sm"
            >
              <Download className="size-4" /> Download Q&A report (PDF)
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
                    <p className="mt-0.5 font-bold text-ink/70">
                      ✓ {q.options[q.correct]}
                    </p>
                  </li>
                ))}
                <li className="flex items-center gap-2 border-t-2 border-dashed border-ink/30 pt-2 text-[11px] font-bold text-ink/50">
                  … {QUIZ_TOTAL - 4} more answers, plus {SEQ_TOTAL} sequence
                  stages, in the full report
                </li>
              </ol>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
