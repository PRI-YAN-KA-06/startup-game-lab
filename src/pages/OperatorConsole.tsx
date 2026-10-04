import { useMutation, useQuery } from "convex/react";
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router";
import { IicLockup } from "@/components/brand/Brand";
import { IntroTab } from "@/components/operator/IntroTab";
import { NotesTab, SequenceTab } from "@/components/operator/ModuleTabs";
import { QuizTab } from "@/components/operator/QuizTab";
import { api } from "@/convex/_generated/api";
import { EVENT, playerJoinUrl } from "@/data/config";
import { useAuth } from "@/hooks/use-auth";

type TabId = "intro" | "quiz" | "sequence" | "notes";

const TABS: { id: TabId; label: string; badge?: string }[] = [
  { id: "intro", label: "Intro" },
  { id: "quiz", label: "Live quiz", badge: "Game 01" },
  { id: "sequence", label: "Sequence", badge: "Game 02" },
  { id: "notes", label: "Notes" },
];

const ROOM_KEY = "startup-school:room";

/**
 * Operator-led home base. Opens on the Startup School intro (with the
 * chatbot video space), then tabs across the live quiz and the modules
 * shipping next.
 */
export default function OperatorConsole() {
  const { signOut, user } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState<TabId>("intro");
  const [code, setCode] = useState<string | null>(() =>
    window.sessionStorage.getItem(ROOM_KEY),
  );
  const createRoom = useMutation(api.game.createRoom);
  const bootstrapped = useRef(false);

  /* one room per operator session */
  useEffect(() => {
    if (code || bootstrapped.current) return;
    bootstrapped.current = true;
    createRoom()
      .then((room) => {
        if (room) {
          window.sessionStorage.setItem(ROOM_KEY, room.code);
          setCode(room.code);
        }
      })
      .catch((err) => console.error("Could not open a room:", err));
  }, [code, createRoom]);

  const room = useQuery(api.game.getRoom, { code: code ?? "" });

  async function handleSignOut() {
    try {
      await signOut();
    } finally {
      navigate("/auth", { replace: true });
    }
  }

  function openNewRoom() {
    window.sessionStorage.removeItem(ROOM_KEY);
    bootstrapped.current = false;
    setCode(null);
  }

  /* ---------- loading / recovery states ---------- */
  if (!code || room === undefined) {
    return (
      <ConsoleShell>
        <div className="nb-panel mx-auto mt-16 max-w-md p-8 text-center">
          <p className="nb-display text-xl">Opening your room…</p>
          <p className="mt-2 text-sm font-medium text-ink/60">
            Allocating a join code for {EVENT.program}.
          </p>
        </div>
      </ConsoleShell>
    );
  }

  if (room === null) {
    return (
      <ConsoleShell>
        <div className="nb-panel mx-auto mt-16 max-w-md p-6 text-center">
          <p className="nb-display text-xl">Room not found</p>
          <p className="mt-2 text-sm font-medium text-ink/60">
            The code {code} is no longer live. Open a fresh room and show the
            new QR to your players.
          </p>
          <button
            type="button"
            onClick={openNewRoom}
            className="nb-btn nb-shadow mt-5 w-full bg-sun"
          >
            Open a new room
          </button>
        </div>
      </ConsoleShell>
    );
  }

  return (
    <ConsoleShell
      roomCode={room.code}
      userEmail={user?.email ?? user?.name ?? null}
      onSignOut={handleSignOut}
    >
      {/* tab bar */}
      <div className="border-b-[3px] border-ink bg-white">
        <div className="mx-auto flex max-w-[1500px] gap-0 overflow-x-auto px-4 sm:px-6">
          {TABS.map((t) => {
            const active = tab === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setTab(t.id)}
                className={`relative flex shrink-0 items-center gap-2 border-x-[3px] border-t-[3px] px-4 py-3 text-xs font-bold uppercase tracking-[0.14em] transition-colors sm:text-sm ${
                  active
                    ? "border-ink bg-ink text-sun"
                    : "border-transparent text-ink/60 hover:bg-sand hover:text-ink"
                }`}
              >
                {t.label}
                {t.badge && (
                  <span
                    className={`nb-tag !px-1.5 !py-0.5 !text-[9px] ${
                      active ? "bg-sun text-ink" : "bg-sand text-ink"
                    }`}
                  >
                    {t.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* tab panels */}
      <div className="mx-auto max-w-[1500px] px-4 py-6 sm:px-6">
        {tab === "intro" && <IntroTab onOpenQuiz={() => setTab("quiz")} />}
        {tab === "quiz" && <QuizTab room={room} />}
        {tab === "sequence" && <SequenceTab />}
        {tab === "notes" && <NotesTab />}
      </div>
    </ConsoleShell>
  );
}

/* ------------------------------------------------------------------ */
/*  chrome                                                             */
/* ------------------------------------------------------------------ */

function ConsoleShell({
  roomCode,
  userEmail,
  onSignOut,
  children,
}: {
  roomCode?: string;
  userEmail?: string | null;
  onSignOut?: () => void;
  children: React.ReactNode;
}) {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-paper">
      <header className="sticky top-0 z-40 border-b-[3px] border-ink bg-paper/95">
        <div className="mx-auto flex max-w-[1500px] flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <div className="flex items-center gap-3">
            <button type="button" onClick={() => navigate("/")}>
              <IicLockup />
            </button>
            <span className="nb-tag bg-cobalt text-white hidden sm:inline-flex">
              Operator console
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {roomCode && (
              <>
                <span className="nb-tag bg-sun">Room {roomCode}</span>
                <a
                  href={playerJoinUrl(roomCode)}
                  target="_blank"
                  rel="noreferrer"
                  className="nb-tag bg-white hover:bg-sand"
                >
                  Player screen ↗
                </a>
              </>
            )}
            {userEmail && (
              <span className="nb-tag bg-mint hidden md:inline-flex">
                {userEmail}
              </span>
            )}
            {onSignOut && (
              <button
                type="button"
                onClick={onSignOut}
                className="nb-tag bg-ink text-white"
              >
                Sign out
              </button>
            )}
          </div>
        </div>
      </header>

      {children}
    </div>
  );
}
