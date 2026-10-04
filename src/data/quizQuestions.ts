export type QuizKind = "TERM" | "SITUATION";

export interface QuizQuestion {
  id: number;
  /** Short topic label shown on the operator stage. */
  concept: string;
  kind: QuizKind;
  prompt: string;
  options: [string, string, string, string];
  correct: 0 | 1 | 2 | 3;
  /** One-line teaching note revealed with the answer. */
  why: string;
}

/**
 * Round 1 pack — 20 startup & business terms taught through situations.
 * Answer positions are deliberately shuffled across A-D so no default
 * letter ever wins.
 */
export const QUIZ_QUESTIONS: QuizQuestion[] = [
  {
    id: 1,
    concept: "MVP",
    kind: "TERM",
    prompt:
      "Which term describes the smallest version of a product that lets you test a core hypothesis with real users?",
    options: [
      "ROI — Return on Investment",
      "MVP — Minimum Viable Product",
      "CRM — Customer Relationship Management",
      "AGM — Annual General Meeting",
    ],
    correct: 1,
    why: "MVP = the smallest build that teaches you the most, fastest.",
  },
  {
    id: 2,
    concept: "Runway",
    kind: "TERM",
    prompt: "In startup language, what does \"runway\" mean?",
    options: [
      "Time until your app is approved on the app store",
      "The path from idea to company registration",
      "Months you can keep operating at your current burn with current cash",
      "Distance from your garage to your first office",
    ],
    correct: 2,
    why: "Runway = how long the money left keeps the lights on.",
  },
  {
    id: 3,
    concept: "Runway math",
    kind: "SITUATION",
    prompt:
      "You have ₹10,00,000 in the bank and burn ₹2,00,000 a month. Your runway is…",
    options: ["5 months", "10 months", "20 months", "2 months"],
    correct: 0,
    why: "Runway = cash ÷ monthly burn. 10L ÷ 2L = 5 months.",
  },
  {
    id: 4,
    concept: "Customer discovery",
    kind: "SITUATION",
    prompt:
      "Your MVP has 40 daily users but zero paying customers. What do you do first?",
    options: [
      "Run a big ad campaign to buy more users",
      "Pivot to a completely new idea tonight",
      "Add ten more features to the app",
      "Talk to users to find what they would actually pay for",
    ],
    correct: 3,
    why: "Talk before you build — willingness to pay is the open question.",
  },
  {
    id: 5,
    concept: "Unit economics",
    kind: "SITUATION",
    prompt:
      "You lose ₹300 on every sale while user numbers keep growing. What matters most right now?",
    options: [
      "Unit economics — fix the loss per sale first",
      "More ads, more users",
      "A bigger office for the team",
      "A full rebrand and new logo",
    ],
    correct: 0,
    why: "Growth on broken unit economics just scales the loss faster.",
  },
  {
    id: 6,
    concept: "CAC",
    kind: "TERM",
    prompt: "What does CAC stand for?",
    options: [
      "Capital And Credit",
      "Customer Acquisition Cost",
      "Cumulative Active Customers",
      "Company Annual Closure",
    ],
    correct: 1,
    why: "CAC = what one winning customer costs you.",
  },
  {
    id: 7,
    concept: "Bootstrapping",
    kind: "TERM",
    prompt: "To \"bootstrap\" a startup means to…",
    options: [
      "Take a fresh bank loan every single month",
      "Fund it from revenue and savings — without outside investors",
      "Sell shares on the stock market",
      "Hire only interns until profitability",
    ],
    correct: 1,
    why: "Bootstrapping = customer money, not investor money.",
  },
  {
    id: 8,
    concept: "Term sheet",
    kind: "TERM",
    prompt: "An investor says: \"I'll send you a term sheet.\" What is it?",
    options: [
      "Your pitch deck, printed on paper",
      "A monthly performance report",
      "An employment contract for the founders",
      "A document outlining the proposed investment terms",
    ],
    correct: 3,
    why: "The term sheet is the deal on paper before the lawyers get involved.",
  },
  {
    id: 9,
    concept: "Pivot",
    kind: "SITUATION",
    prompt:
      "Six months in, data shows users ignore your main product but love one side feature. Best move?",
    options: [
      "Study the signal and pivot toward the loved feature",
      "Ignore the data and stay the course",
      "Fire the marketing team immediately",
      "Double your prices by tomorrow",
    ],
    correct: 0,
    why: "A pivot is a data-led change of direction, not a panic quit.",
  },
  {
    id: 10,
    concept: "Traction",
    kind: "TERM",
    prompt: "Which of these is a real example of \"traction\"?",
    options: [
      "A fancy office in a startup hub",
      "A mention in a college group chat",
      "Signups, revenue and retention climbing month on month",
      "The size of your founding team",
    ],
    correct: 2,
    why: "Traction is evidence of demand — not decoration.",
  },
  {
    id: 11,
    concept: "Founder vesting",
    kind: "SITUATION",
    prompt:
      "Two co-founders: one works full-time, the other may leave in six months. How should equity be handled?",
    options: [
      "50/50 on a handshake — decide later",
      "A written founder agreement with equity vesting over ~4 years",
      "Give the active founder 100% immediately",
      "Ignore it until investors ask about it",
    ],
    correct: 1,
    why: "Vesting ties equity to contribution over time.",
  },
  {
    id: 12,
    concept: "Equity",
    kind: "TERM",
    prompt: "\"Equity\" in a startup is…",
    options: [
      "Ownership stake — a slice of the company",
      "A loan the company must repay",
      "The company's monthly revenue",
      "The market value of the brand",
    ],
    correct: 0,
    why: "Equity = ownership. Every slice given away is a slice you keep less of.",
  },
  {
    id: 13,
    concept: "Dilution math",
    kind: "SITUATION",
    prompt:
      "Post-money valuation is ₹2 Crore and an investor puts in ₹50 Lakh. Roughly what % do they own after the round?",
    options: ["5%", "50%", "2.5%", "25%"],
    correct: 3,
    why: "Post-money % = investment ÷ post-money valuation. 50L ÷ 2Cr = 25%.",
  },
  {
    id: 14,
    concept: "Smoke test",
    kind: "SITUATION",
    prompt:
      "Before writing a single line of code, what is the leanest way to test demand?",
    options: [
      "A landing page with a sign-up button and a small ad budget",
      "Hire a team of ten engineers",
      "Sign a two-year office lease",
      "Print ten thousand flyers",
    ],
    correct: 0,
    why: "A smoke test measures clicks-with-intent before you build anything.",
  },
  {
    id: 15,
    concept: "Burn control",
    kind: "SITUATION",
    prompt:
      "Your runway is 3 months, but fundraising typically takes 6. What do you do?",
    options: [
      "Cut burn and start raising immediately — in parallel",
      "Wait and hope the market improves",
      "Hire ahead of revenue to look bigger",
      "Stop tracking cash so it stops hurting",
    ],
    correct: 0,
    why: "Cut costs and fundraise at the same time — never in sequence.",
  },
  {
    id: 16,
    concept: "Cap table",
    kind: "TERM",
    prompt: "A company's \"cap table\" is…",
    options: [
      "A chart of the company's monthly expenses",
      "A list of every app feature you have shipped",
      "The register of who owns what % of the company",
      "A table of parking slots in the office",
    ],
    correct: 2,
    why: "The cap table is the ownership map — get it right early.",
  },
  {
    id: 17,
    concept: "Moat",
    kind: "SITUATION",
    prompt:
      "A competitor clones your app in two weeks. What is your strongest defence?",
    options: [
      "Hide the idea and never tell anyone",
      "Send a legal notice on day one",
      "Out-execute them: ship faster, own the distribution and community",
      "Shut the product down before they do",
    ],
    correct: 2,
    why: "Ideas are cheap; execution and distribution are the moat.",
  },
  {
    id: 18,
    concept: "Product–market fit",
    kind: "TERM",
    prompt: "Which signal best proves product–market fit?",
    options: [
      "Users keep coming back and would be upset if you disappeared",
      "10,000 downloads from a single promo drop",
      "A big account tweeted about you once",
      "Your logo won a design award",
    ],
    correct: 0,
    why: "The Sean Ellis test: would users be very disappointed without you?",
  },
  {
    id: 19,
    concept: "Focus",
    kind: "SITUATION",
    prompt:
      "A big client offers ₹50 Lakh for custom work that would derail your roadmap. What do you do?",
    options: [
      "Take it — the roadmap never matters anyway",
      "Ghost the client for a month",
      "Weigh strategic fit vs focus — renegotiate or say no if it breaks the plan",
      "Cancel the roadmap forever",
    ],
    correct: 2,
    why: "Custom revenue is a trap when it kills your core product.",
  },
  {
    id: 20,
    concept: "Angel investor",
    kind: "TERM",
    prompt: "Who exactly is an \"angel investor\"?",
    options: [
      "A bank that gives collateral-free loans",
      "The government's startup funding cell",
      "A company's audit and compliance partner",
      "An individual investing their own money at the early stage",
    ],
    correct: 3,
    why: "Angels write personal cheques, early, before institutions show up.",
  },
];

export const CHOICE_LETTERS = ["A", "B", "C", "D"] as const;
