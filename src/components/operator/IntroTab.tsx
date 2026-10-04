import { motion } from "framer-motion";
import { Link } from "react-router";
import {
  BulbIcon,
  CircleCluster,
  IicLockup,
} from "@/components/brand/Brand";
import { VideoStage } from "@/components/operator/VideoStage";
import { EVENT, QUIZ_TOTAL, ROUND_SECONDS } from "@/data/config";

const AGENDA = [
  {
    n: "01",
    title: "Warm-up terms",
    body: "Bulb on — introduce MVP, runway, bootstrapping with the room.",
    color: "bg-sun",
  },
  {
    n: "02",
    title: `Live quiz · ${QUIZ_TOTAL} questions`,
    body: `Operator clock of ${ROUND_SECONDS}s, live tally, reveal and star fuel.`,
    color: "bg-mint",
  },
  {
    n: "03",
    title: "Sequence ladder",
    body: "Stage 1 → 5: arrange the startup steps in the right order.",
    color: "bg-sky",
  },
  {
    n: "04",
    title: "Notes & takeaways",
    body: "Hand out the Q&A report so everyone keeps the lessons.",
    color: "bg-coral",
  },
];

/** The landing screen of the operator console: welcome + the video space. */
export function IntroTab({ onOpenQuiz }: { onOpenQuiz: () => void }) {
  return (
    <div className="grid gap-6">
      {/* welcome hero */}
      <section className="nb-dots relative overflow-hidden border-[3px] border-ink bg-white shadow-[6px_6px_0_0_#0e0e0e]">
        <div className="relative grid gap-6 p-5 sm:p-7 lg:grid-cols-[1.3fr_1fr] lg:items-center">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="nb-tag bg-violet text-white">
                {EVENT.university}
              </span>
              <span className="nb-tag bg-coral text-white">{EVENT.cell}</span>
              <span className="nb-tag bg-white">Operator intro</span>
            </div>

            <h1 className="mt-4 flex flex-col items-start gap-2">
              <span className="nb-display bg-ink px-3 py-1.5 text-4xl text-white sm:text-5xl">
                Startup
              </span>
              <span className="nb-display border-[3px] border-ink bg-sun px-3 py-1.5 text-4xl shadow-[6px_6px_0_0_#0e0e0e] sm:text-5xl">
                School
              </span>
            </h1>

            <p className="mt-4 max-w-xl text-sm font-medium leading-relaxed text-ink/75 sm:text-base">
              Welcome to the host desk. This screen drives the whole room —
              start the clock, watch the tally build, reveal the answer and
              fuel the stars. Players only ever see what you release here.
            </p>

            <div className="mt-5 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={onOpenQuiz}
                className="nb-btn nb-shadow bg-sun text-sm"
              >
                Open live quiz →
              </button>
            </div>
          </div>

          <div className="relative mx-auto flex h-56 w-full max-w-xs items-center justify-center">
            <CircleCluster className="absolute h-48 w-48" />
            <BulbIcon
              on
              className="relative h-40 w-40"
              style={{ animation: "nb-float 4s ease-in-out infinite" }}
            />
            <motion.span
              className="nb-tag absolute right-0 top-2 rotate-3 bg-ink text-white"
              animate={{ y: [0, -4, 0] }}
              transition={{ duration: 2.4, repeat: Infinity }}
            >
              Lights on
            </motion.span>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t-[3px] border-ink bg-sand px-5 py-3">
          <IicLockup compact />
          <span className="nb-tag bg-white">{EVENT.tagline}</span>
        </div>
      </section>

      {/* video space — operator screen only */}
      <section className="nb-panel overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b-[3px] border-ink bg-ink px-4 py-3">
          <span className="nb-display text-base text-sun">
            Chatbot video space
          </span>
          <span className="nb-tag bg-coral text-white">
            Operator screen only
          </span>
        </div>
        <div className="grid gap-4 p-4 lg:grid-cols-[1.6fr_1fr] lg:items-center">
          <VideoStage onEnded={onOpenQuiz} />
          <div className="grid gap-3">
            <p className="text-sm font-medium leading-relaxed text-ink/75">
              The chatbot reel plays here before the session starts — hit the
              fullscreen button to throw it onto the projector for the whole
              room, then the site hands over to the games. It never appears on
              player devices.
            </p>
            <ul className="grid gap-2 text-sm font-bold">
              <li className="border-2 border-ink bg-sand px-3 py-2">
                1 · Play the reel as the room settles
              </li>
              <li className="border-2 border-ink bg-sand px-3 py-2">
                2 · Show it fullscreen to everyone
              </li>
              <li className="border-2 border-ink bg-sand px-3 py-2">
                3 · Jump into the live quiz
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* agenda */}
      <section>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 className="nb-display text-2xl">Session agenda</h2>
          <Link to="/" className="nb-tag bg-white">
            View public landing →
          </Link>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {AGENDA.map((item, i) => (
            <motion.div
              key={item.n}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: i * 0.06 }}
              className="border-[3px] border-ink bg-white shadow-[6px_6px_0_0_#0e0e0e]"
            >
              <div
                className={`flex items-center justify-between border-b-[3px] border-ink px-3 py-2 ${item.color}`}
              >
                <span className="nb-display text-lg">{item.n}</span>
                <span className="nb-tag bg-white">Step</span>
              </div>
              <div className="p-3">
                <h3 className="nb-display text-sm">{item.title}</h3>
                <p className="mt-1.5 text-xs font-medium leading-relaxed text-ink/70">
                  {item.body}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>
    </div>
  );
}
