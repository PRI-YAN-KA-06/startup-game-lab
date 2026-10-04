import { useMutation } from "convex/react";
import { useState } from "react";
import { api } from "@/convex/_generated/api";
import { PLAYER_PASSCODE } from "@/data/config";
import {
  savePlayerSession,
  type PlayerSession,
} from "@/lib/player-session";

/**
 * The player's login: room code + display name + the event passcode IIC hands
 * out on the day. One form, reused by `/auth` and by the QR landing route.
 */
export function PlayerJoinForm({
  defaultRoom = "",
  onJoined,
  autoFocusName = false,
}: {
  defaultRoom?: string;
  onJoined?: (session: PlayerSession) => void;
  autoFocusName?: boolean;
}) {
  const [room, setRoom] = useState(defaultRoom.toUpperCase());
  const [name, setName] = useState("");
  const [passcode, setPasscode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const join = useMutation(api.game.joinPlayer);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      const result = await join({
        roomCode: room.trim().toUpperCase(),
        name: name.trim(),
        passcode: passcode.trim(),
      });
      const session: PlayerSession = {
        roomCode: room.trim().toUpperCase(),
        roomId: result.roomId,
        playerId: result.playerId,
        name: name.trim(),
      };
      savePlayerSession(session);
      onJoined?.(session);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not join the room.",
      );
    } finally {
      setBusy(false);
    }
  }

  const inputClass =
    "w-full border-[3px] border-ink bg-white px-3 py-3 text-base font-bold outline-none placeholder:font-medium placeholder:text-ink/40 focus:bg-sun/30";

  return (
    <form onSubmit={handleSubmit} className="grid gap-4">
      <div className="grid gap-1.5">
        <label
          htmlFor="join-room"
          className="nb-tag w-fit bg-sun text-ink"
        >
          Room code
        </label>
        <input
          id="join-room"
          value={room}
          onChange={(e) => setRoom(e.target.value.toUpperCase().slice(0, 4))}
          placeholder="ABCD"
          maxLength={4}
          autoCapitalize="characters"
          required
          className={`${inputClass} nb-display text-center text-3xl tracking-[0.4em]`}
        />
      </div>

      <div className="grid gap-1.5">
        <label htmlFor="join-name" className="nb-tag w-fit bg-mint text-ink">
          Your name
        </label>
        <input
          id="join-name"
          value={name}
          onChange={(e) => setName(e.target.value.slice(0, 24))}
          placeholder="e.g. Aarav"
          maxLength={24}
          required
          autoFocus={autoFocusName}
          className={inputClass}
        />
      </div>

      <div className="grid gap-1.5">
        <label htmlFor="join-code" className="nb-tag w-fit bg-coral text-white">
          Player passcode
        </label>
        <input
          id="join-code"
          value={passcode}
          onChange={(e) => setPasscode(e.target.value.slice(0, 24))}
          placeholder={`e.g. ${PLAYER_PASSCODE}`}
          type="password"
          required
          className={inputClass}
        />
      </div>

      {error && (
        <p className="border-[3px] border-ink bg-coral px-3 py-2 text-sm font-bold text-white">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={busy}
        className="nb-btn nb-shadow bg-ink text-base text-white"
      >
        {busy ? "Joining…" : "Enter the arena →"}
      </button>

      <p className="text-center text-xs font-medium text-ink/60">
        Passcode is shown on the operator screen. One name per player, please.
      </p>
    </form>
  );
}
