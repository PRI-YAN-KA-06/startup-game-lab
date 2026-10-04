/** Passcode players type in to enter the arena (given out by IIC on event day). */
export const PLAYER_PASSCODE = "IIC2026";

/** Identity of the programme. */
export const EVENT = {
  cell: "Innovation and Incubation Cell",
  cellShort: "IIC",
  university: "Rajasthan Technical University",
  program: "Startup School",
  tagline: "Your journey from student to founder starts here",
} as const;

/** How many live situation questions ship in v1. */
export const QUIZ_TOTAL = 20;

/** Operator-controlled round length. */
export const ROUND_SECONDS = 10;

/**
 * Chatbot intro reel shown on the operator screen only.
 * Drop the file at public/videos/chatbot-intro.mp4 and it plays automatically;
 * until then the stage shows its animated placeholder.
 */
export const INTRO_VIDEO_SRC = "/videos/chatbot-intro.mp4";

/** Where a player lands after scanning the operator's QR code. */
export function playerJoinUrl(roomCode: string) {
  const origin =
    typeof window !== "undefined" ? window.location.origin : "https://localhost";
  return `${origin}/play?room=${encodeURIComponent(roomCode)}`;
}

/** Flat colour blocking for the four options — identical on every screen. */
export const OPTION_STYLES = ["bg-sun", "bg-mint", "bg-sky", "bg-coral"] as const;
export const OPTION_LETTERS = ["A", "B", "C", "D"] as const;
