import type { Id } from "@/convex/_generated/dataModel";

export type PlayerSession = {
  roomCode: string;
  roomId: Id<"gameRooms">;
  playerId: Id<"gamePlayers">;
  name: string;
};

const SESSION_KEY = "startup-school:player";

export function loadPlayerSession(): PlayerSession | null {
  try {
    const raw = window.localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as PlayerSession;
    if (!parsed?.roomCode || !parsed?.playerId || !parsed?.name) return null;
    if (!parsed.roomId) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function savePlayerSession(session: PlayerSession) {
  window.localStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

export function clearPlayerSession() {
  window.localStorage.removeItem(SESSION_KEY);
}
