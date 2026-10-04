import { motion } from "framer-motion";
import { Link } from "react-router";
import {
  BulbIcon,
  CircleCluster,
  IicLockup,
} from "@/components/brand/Brand";
import { EVENT, QUIZ_TOTAL, ROUND_SECONDS } from "@/data/config";
import { QUIZ_QUESTIONS } from "@/data/quizQuestions";

const TICKER = [
  "PITCH DECK",
  "MVP",
  "RUNWAY",
  "BOOTSTRAPPING",
  "EQUITY",
  "TERM SHEET",
  "CAP TABLE",
  "TRACTION",
  "CAC",
  "DILUTION",
  "PIVOT",
  "ANGEL ROUND",
];

const STEPS = [
  {
    n: "01",
    title: "Operator signs in",
    body: "Open the console, start a room. A 4-letter code + QR appear on the big screen.",
    color: "bg-sun",
  },
  {
    n: "02",
    title: "Players scan the QR",
    body: "Every phone/laptop joins the room with the event passcode. No app install.",
    color: "bg-mint",
  },
  {
    n: "03",
    title: "Timer drops the options",
    body: "Only the operator can start the 10-second clock. The four options then light up on every player device.",
    color: "bg-cobalt text-white",
  },
  {
    n: "04",
    title: "Reveal & fuel the stars",
    body: "Operator shows the answer. Correct players bank a star — and you watch them fuel up live.",
    color: "bg-coral",
  },
];

const TERMS = QUIZ_QUESTIONS.map((q) => q.concept);

export default function Landing() {
  return (
    <div className="min-h-screen bg-paper">
      {/* ---------------- top bar ---------------- */}
      <header className="sticky top-0 z-40 border-b-[3px] border-ink bg-paper/95 backdrop-blur-[2px]">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <Link to="/" className="shrink-0">
            <IicLockup on />
          </Link>
          <nav className="hidden items-center gap-6 text-xs font-bold uppercase tracking-[0.16em] md:flex">
            <a href="#games" className="hover:underline decoration-2">
              Games
            </a>
            <a href="#how" className="hover:underline decoration-2">
              How it works
            </a>
            <a href="#learn" className="hover:underline decoration-2">
              Syllabus
            </a>
          </nav>
          <div className="flex items-center gap-2">
            <Link
              to="/play"
              className="nb-btn bg-cobalt text-white !px-3 !py-2 text-[11px] sm:!px-4 sm:text-xs"
            >
              Player join
            </Link>
            <Link
              to="/auth?returnTo=/operator"
              className="nb-btn bg-sun !px-3 !py-2 text-[11px] sm:!px-4 sm:text-xs"
            >
              Operator
            </Link>
          </div>
        </div>
      </header>

      {/* ---------------- hero ---------------- */}
      <section className="nb-dots border-b-[3px] border-ink">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:px-6 lg:grid-cols-[1.15fr_1fr] lg:items-center lg:py-16">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="flex flex-wrap items-center gap-2">
              <span className="nb-tag bg-violet text-white">
                {EVENT.university}
              </span>
              <span className="nb-tag bg-coral text-white">{EVENT.cell}</span>
              <span className="nb-tag bg-white">Offline ready</span>
            </div>

            <h1 className="mt-6 flex flex-col items-start gap-2">
              <span className="nb-display bg-ink px-3 py-2 text-5xl text-white sm:text-6xl lg:text-7xl">
                Startup
              </span>
              <span className="nb-display border-[3px] border-ink bg-sun px-3 py-2 text-5xl text-ink shadow-[8px_8px_0_0_#0e0e0e] sm:text-6xl lg:text-7xl">
                School
              </span>
            </h1>

            <p className="mt-6 max-w-xl text-base font-medium leading-relaxed text-ink/80 sm:text-lg">
              A live, operator-led arena where {QUIZ_TOTAL} startup situations
              hit the room with a {ROUND_SECONDS}-second clock. Players answer
              on their own devices, the operator reveals the truth, and every
              correct call fuels a star.
            </p>

            <div className="mt-7 flex flex-wrap items-center gap-3">
              <Link
                to="/auth?returnTo=/operator"
                className="nb-btn bg-sun text-sm shadow-[6px_6px_0_0_#0e0e0e]"
              >
                Enter operator console →
              </Link>
              <Link
                to="/play"
                className="nb-btn bg-white text-sm shadow-[6px_6px_0_0_#0e0e0e]"
              >
                Join as player
              </Link>
            </div>

            <dl className="mt-8 grid max-w-lg grid-cols-3 border-[3px] border-ink bg-white">
              <div className="border-r-[3px] border-ink p-3 text-center">
                <dt className="nb-display text-2xl">{QUIZ_TOTAL}</dt>
                <dd className="text-[10px] font-bold uppercase tracking-[0.14em] text-ink/60">
                  Live questions
                </dd>
              </div>
              <div className="border-r-[3px] border-ink p-3 text-center">
                <dt className="nb-display text-2xl">{ROUND_SECONDS}s</dt>
                <dd className="text-[10px] font-bold uppercase tracking-[0.14em] text-ink/60">
                  Operator clock
                </dd>
              </div>
              <div className="p-3 text-center">
                <dt className="nb-display text-2xl">★ 1</dt>
                <dd className="text-[10px] font-bold uppercase tracking-[0.14em] text-ink/60">
                  Per correct pick
                </dd>
              </div>
            </dl>
          </motion.div>

          {/* the bulb — always lit */}
          <motion.div
            initial={{ opacity: 0, scale: 0.94 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.15 }}
            className="mx-auto w-full max-w-md"
          >
            <div className="nb-panel nb-shadow-lg block w-full overflow-hidden p-6 text-left">
              <div className="flex items-center justify-between">
                <span className="nb-tag bg-white">Idea: lights on</span>
                <span className="nb-tag bg-ink text-white">Always on</span>
              </div>

              <div className="relative mx-auto mt-4 flex h-56 items-center justify-center">
                <CircleCluster className="absolute left-1/2 top-1/2 h-52 w-52 -translate-x-1/2 -translate-y-1/2" />
                <BulbIcon
                  on
                  className="relative h-44 w-44"
                  style={{ animation: "nb-float 4s ease-in-out infinite" }}
                />
              </div>

              <div className="mt-2 border-t-[3px] border-ink pt-3">
                <p className="nb-display text-xl">Gear turning. Let's build.</p>
                <p className="mt-1 text-sm font-medium text-ink/70">
                  This is how the room feels when 30 players answer at once.
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ---------------- ticker ---------------- */}
      <div className="overflow-hidden border-b-[3px] border-ink bg-ink py-3">
        <div
          className="flex w-max nb-display text-sm text-sun"
          style={{ animation: "nb-marquee 26s linear infinite" }}
        >
          {[0, 1].map((half) => (
            <span key={half} className="flex shrink-0">
              {TICKER.map((t) => (
                <span key={`${half}-${t}`} className="px-6">
                  {t} <span className="text-white">✦</span>
                </span>
              ))}
            </span>
          ))}
        </div>
      </div>

      {/* ---------------- games ---------------- */}
      <section id="games" className="border-b-[3px] border-ink bg-paper">
        <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <h2 className="nb-display text-3xl sm:text-4xl">
              Two games. One arena.
            </h2>
            <p className="max-w-md text-sm font-medium text-ink/70">
              Both run off the same operator control desk — the operator starts
              the clock, the room plays, the board decides.
            </p>
          </div>

          <div className="mt-8 grid gap-6 md:grid-cols-2">
            <article className="nb-panel nb-shadow flex flex-col">
              <div className="flex items-center justify-between border-b-[3px] border-ink bg-violet px-4 py-3 text-white">
                <span className="nb-display text-lg">Game 01</span>
                <span className="nb-tag bg-mint text-ink">Live now</span>
              </div>
              <div className="flex flex-1 flex-col gap-3 p-5">
                <h3 className="nb-display text-2xl">Situation Quiz</h3>
                <p className="text-sm font-medium leading-relaxed text-ink/75">
                  {QUIZ_TOTAL} real startup calls — funding, runway, dilution,
                  product focus. The operator starts a {ROUND_SECONDS}s timer,
                  four options land on every player device, and the tally builds
                  live on the big screen.
                </p>
                <ul className="mt-auto grid gap-2 pt-2 text-sm font-bold">
                  <li className="border-2 border-ink bg-sand px-3 py-2">
                    ✓ Operator-only clock & reveal
                  </li>
                  <li className="border-2 border-ink bg-sand px-3 py-2">
                    ✓ Live "who picked what" tally
                  </li>
                  <li className="border-2 border-ink bg-sand px-3 py-2">
                    ✓ Star fuel-up on every correct answer
                  </li>
                </ul>
              </div>
            </article>

            <article className="nb-panel nb-shadow flex flex-col">
              <div className="flex items-center justify-between border-b-[3px] border-ink bg-sky px-4 py-3">
                <span className="nb-display text-lg">Game 02</span>
                <span className="nb-tag bg-white">5 stages</span>
              </div>
              <div className="flex flex-1 flex-col gap-3 p-5">
                <h3 className="nb-display text-2xl">Sequence Ladder</h3>
                <p className="text-sm font-medium leading-relaxed text-ink/75">
                  Rearrange the steps of a startup in the right order — from
                  incorporation to investing rounds — across five stages that
                  climb from easy to brutal.
                </p>
                <div className="mt-auto grid grid-cols-5 gap-2 pt-2">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <div
                      key={s}
                      className="border-2 border-ink bg-white py-3 text-center"
                    >
                      <span className="nb-display text-lg">S{s}</span>
                    </div>
                  ))}
                </div>
              </div>
            </article>
          </div>
        </div>
      </section>

      {/* ---------------- how it works ---------------- */}
      <section id="how" className="border-b-[3px] border-ink bg-white">
        <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6">
          <h2 className="nb-display text-3xl sm:text-4xl">How the room runs</h2>
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {STEPS.map((s, i) => (
              <motion.div
                key={s.n}
                initial={{ opacity: 0, y: 18 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.35, delay: i * 0.07 }}
                className="border-[3px] border-ink bg-white shadow-[6px_6px_0_0_#0e0e0e]"
              >
                <div
                  className={`flex items-center justify-between border-b-[3px] border-ink px-4 py-3 ${s.color}`}
                >
                  <span className="nb-display text-xl">{s.n}</span>
                  <span className="nb-tag bg-white text-ink">Step</span>
                </div>
                <div className="p-4">
                  <h3 className="nb-display text-base">{s.title}</h3>
                  <p className="mt-2 text-sm font-medium leading-relaxed text-ink/75">
                    {s.body}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ---------------- syllabus chips ---------------- */}
      <section id="learn" className="border-b-[3px] border-ink bg-sand">
        <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <h2 className="nb-display text-3xl sm:text-4xl">
              What you'll learn
            </h2>
            <span className="nb-tag bg-white">
              {TERMS.length} concepts on the board
            </span>
          </div>
          <div className="mt-7 flex flex-wrap gap-3">
            {TERMS.map((term, i) => (
              <span
                key={term}
                className="nb-tag cursor-default !px-4 !py-3 text-xs transition-transform duration-150 hover:-translate-y-1"
                style={{
                  background: [
                    "#ffd23f",
                    "#ffffff",
                    "#37d9a0",
                    "#ffffff",
                    "#ff8a3d",
                  ][i % 5],
                }}
              >
                {term}
              </span>
            ))}
          </div>

          <div className="mt-10 grid gap-5 border-[3px] border-ink bg-ink p-6 text-white sm:grid-cols-3">
            <div>
              <p className="nb-display text-3xl text-sun">Scan</p>
              <p className="mt-1 text-sm font-medium text-white/75">
                Players connect once by QR while the network is on.
              </p>
            </div>
            <div>
              <p className="nb-display text-3xl text-mint">Play</p>
              <p className="mt-1 text-sm font-medium text-white/75">
                The game itself runs light — no installs, no accounts for
                players.
              </p>
            </div>
            <div>
              <p className="nb-display text-3xl text-coral">Keep</p>
              <p className="mt-1 text-sm font-medium text-white/75">
                Take the Q&A report home as a downloadable note.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ---------------- final CTA ---------------- */}
      <section className="border-b-[3px] border-ink bg-sun">
        <div className="mx-auto flex max-w-7xl flex-col items-start gap-6 px-4 py-14 sm:px-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="nb-display text-4xl sm:text-5xl">
              Ready? Boot up
              <br />
              the school.
            </h2>
            <p className="mt-3 max-w-md text-sm font-bold text-ink/75">
              {EVENT.tagline} — {EVENT.cellShort}, {EVENT.university}.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link to="/auth?returnTo=/operator" className="nb-btn bg-ink text-white">
              Operator console →
            </Link>
            <Link to="/play" className="nb-btn bg-white">
              Player join
            </Link>
          </div>
        </div>
      </section>

      <footer className="bg-paper">
        <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-4 px-4 py-6 sm:flex-row sm:items-center sm:px-6">
          <IicLockup on />
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-ink/60">
            {EVENT.cell} · {EVENT.university} · Startup School
          </p>
        </div>
      </footer>
    </div>
  );
}
