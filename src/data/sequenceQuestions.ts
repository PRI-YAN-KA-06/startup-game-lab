/** A single rearrange-the-sequence round (Game 02 — Sequence Ladder). */
export interface SequenceStage {
  id: number;
  /** Ladder position 1 → 5 (easy → brutal). */
  stage: number;
  /** Difficulty chip. */
  label: string;
  /** Ladder theme shown on the stage cards. */
  title: string;
  /** Short topic label shown on the operator stage. */
  concept: string;
  prompt: string;
  /** The steps, listed in the CORRECT order (index 0 comes first). */
  steps: string[];
  /**
   * Scrambled display order — indices into `steps`, exactly as every device
   * shows them. Never the identity permutation, so nobody gets it for free.
   */
  order: number[];
  /** One-line teaching note revealed with the answer. */
  why: string;
  /** Tailwind tint for the stage card header. */
  tint: string;
}

/**
 * Round 2 pack — five stages climbing from easy to brutal. The correct
 * sequence is always `steps` in order; players rebuild it from `order`.
 */
export const SEQUENCE_STAGES: SequenceStage[] = [
  {
    id: 1,
    stage: 1,
    label: "Easy",
    title: "Idea → Incorporation",
    concept: "Incorporate",
    prompt:
      "You're turning a final-year project into a company. Put these four moves in the order founders actually do them.",
    steps: [
      "Solve a real problem you've personally seen",
      "Validate demand — interviews, waitlist, pre-orders",
      "Register the company (Pvt Ltd / LLP / OPC)",
      "Open a current account and keep clean books",
    ],
    order: [2, 0, 3, 1],
    why: "Validate before you incorporate — paperwork first is the classic student-founder trap.",
    tint: "bg-mint",
  },
  {
    id: 2,
    stage: 2,
    label: "Warm-up",
    title: "Build the MVP",
    concept: "MVP build",
    prompt:
      "The idea is validated and the company exists. Sequence the build of the first product.",
    steps: [
      "Write down the one job the product must do",
      "Sketch the smallest flow that does that job",
      "Build only that flow — weeks, not months",
      "Ship it to 10 real users and watch them use it",
    ],
    order: [1, 3, 2, 0],
    why: "MVP means smallest learn-fast build — scope creep is the enemy of shipping.",
    tint: "bg-sun",
  },
  {
    id: 3,
    stage: 3,
    label: "Medium",
    title: "First customers",
    concept: "First revenue",
    prompt:
      "The MVP works and users love it. Sequence how you get from free users to paying customers.",
    steps: [
      "Launch to one narrow niche, not everyone",
      "Onboard the first 10 customers personally",
      "Fix the top friction they all hit",
      "Turn on billing and ask for the money",
      "Collect a testimonial and ask for a referral",
    ],
    order: [3, 0, 4, 1, 2],
    why: "Charge early — polite users who never pay are an expensive illusion.",
    tint: "bg-tang",
  },
  {
    id: 4,
    stage: 4,
    label: "Hard",
    title: "Seed & dilution",
    concept: "Fundraise",
    prompt:
      "Traction is real and you're raising your first institutional round. Put the fundraise in order.",
    steps: [
      "Hit traction that justifies a seed round",
      "Build the deck and shortlist lead investors",
      "Get a term sheet and choose your lead",
      "Run legal due diligence and sign the papers",
      "Close the round and bank the money",
    ],
    order: [2, 4, 1, 3, 0],
    why: "Dilution is permanent — choose the lead before the money, never after.",
    tint: "bg-coral",
  },
  {
    id: 5,
    stage: 5,
    label: "Brutal",
    title: "Crisis calls",
    concept: "Crisis",
    prompt:
      "Runway is 6 weeks and growth has flatlined. Sequence the crisis response.",
    steps: [
      "Accept the numbers — say it out loud to the team",
      "Cut burn: scope, salaries, offices — extend runway",
      "Tell investors the truth and what you need",
      "Double down on the one segment that still pays",
      "Decide: rebuild the plan or wind down cleanly",
    ],
    order: [4, 2, 0, 3, 1],
    why: "Truth first, cuts second, story third — founders die waiting for the numbers to fix themselves.",
    tint: "bg-violet text-white",
  },
];

/** How many stages ship in the Sequence Ladder. */
export const SEQ_TOTAL = SEQUENCE_STAGES.length;
