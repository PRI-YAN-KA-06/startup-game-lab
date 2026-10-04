import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import type { MutationCtx, QueryCtx } from "./_generated/server";
import type { Id } from "./_generated/dataModel";
import { PLAYER_PASSCODE, QUIZ_TOTAL } from "../data/config";

/**
 * Live room state for the operator-led quiz.
 *
 * The question pack itself ships in the JS bundle (so every device renders the
 * same prompt offline); Convex only carries the room phase, the timer, who
 * picked what, and how many stars each player has banked.
 */

const CODE_ALPHABET = "ACDEFGHJKLMNPQRTUVWXY3479";

function randomCode() {
  let out = "";
  for (let i = 0; i < 4; i++) {
    out += CODE_ALPHABET[Math.floor(Math.random() * CODE_ALPHABET.length)];
  }
  return out;
}

async function roomByCode(ctx: QueryCtx | MutationCtx, code: string) {
  return await ctx.db
    .query("gameRooms")
    .withIndex("by_code", (q) => q.eq("code", code.trim().toUpperCase()))
    .unique();
}

async function clearAnswers(
  ctx: MutationCtx,
  roomId: Id<"gameRooms">,
  questionIndex: number,
) {
  const old = await ctx.db
    .query("gameAnswers")
    .withIndex("by_room_question", (q) =>
      q.eq("roomId", roomId).eq("questionIndex", questionIndex),
    )
    .collect();
  for (const answer of old) await ctx.db.delete(answer._id);
}

/** Operator: spin up a fresh room with a 4-letter join code. */
export const createRoom = mutation({
  args: {},
  handler: async (ctx) => {
    for (let attempt = 0; attempt < 12; attempt++) {
      const code = randomCode();
      if ((await roomByCode(ctx, code)) === null) {
        const roomId = await ctx.db.insert("gameRooms", {
          code,
          phase: "lobby",
          questionIndex: 0,
          totalQuestions: QUIZ_TOTAL,
          awarded: false,
          createdAt: Date.now(),
        });
        return await ctx.db.get(roomId);
      }
    }
    throw new Error("Could not allocate a room code — try again.");
  },
});

/** Anyone: live room snapshot by code (reactive subscription). */
export const getRoom = query({
  args: { code: v.string() },
  handler: async (ctx, { code }) => {
    if (!code.trim()) return null;
    return await roomByCode(ctx, code);
  },
});

/** Player: name + event passcode → joins (or rejoins) the room. */
export const joinPlayer = mutation({
  args: { roomCode: v.string(), name: v.string(), passcode: v.string() },
  handler: async (ctx, { roomCode, name, passcode }) => {
    if (passcode.trim().toUpperCase() !== PLAYER_PASSCODE.toUpperCase()) {
      throw new Error("Wrong player passcode — ask the operator for it.");
    }
    const cleanName = name.trim().slice(0, 24);
    if (cleanName.length < 2) {
      throw new Error("Enter a name with at least 2 characters.");
    }
    const room = await roomByCode(ctx, roomCode);
    if (!room) {
      throw new Error("No room with that code — check the operator screen.");
    }
    const existing = await ctx.db
      .query("gamePlayers")
      .withIndex("by_room_name", (q) =>
        q.eq("roomId", room._id).eq("name", cleanName),
      )
      .unique();
    if (existing) {
      return { playerId: existing._id, roomId: room._id, rejoined: true };
    }
    const playerId = await ctx.db.insert("gamePlayers", {
      roomId: room._id,
      name: cleanName,
      stars: 0,
      joinedAt: Date.now(),
    });
    return { playerId, roomId: room._id, rejoined: false };
  },
});

export const listPlayers = query({
  args: { roomId: v.id("gameRooms") },
  handler: async (ctx, { roomId }) => {
    const players = await ctx.db
      .query("gamePlayers")
      .withIndex("by_room", (q) => q.eq("roomId", roomId))
      .collect();
    return players.sort(
      (a, b) => b.stars - a.stars || a.joinedAt - b.joinedAt,
    );
  },
});

export const getMyPlayer = query({
  args: { playerId: v.id("gamePlayers") },
  handler: async (ctx, { playerId }) => {
    return await ctx.db.get(playerId);
  },
});

/** Operator: put a question on screen (options stay hidden on player devices). */
export const startQuestion = mutation({
  args: { roomId: v.id("gameRooms"), index: v.number() },
  handler: async (ctx, { roomId, index }) => {
    const room = await ctx.db.get(roomId);
    if (!room) throw new Error("Room not found.");
    const safe = Math.max(
      0,
      Math.min(room.totalQuestions - 1, Math.floor(index)),
    );
    await clearAnswers(ctx, roomId, safe);
    await ctx.db.patch(roomId, {
      phase: "question",
      questionIndex: safe,
      awarded: false,
      roundStartedAt: undefined,
      timerMs: undefined,
      correctChoice: undefined,
    });
  },
});

/** Operator: the big START button — opens voting for N seconds. */
export const startVoting = mutation({
  args: { roomId: v.id("gameRooms"), seconds: v.number() },
  handler: async (ctx, { roomId, seconds }) => {
    const room = await ctx.db.get(roomId);
    if (!room) throw new Error("Room not found.");
    if (room.phase !== "question") {
      throw new Error("Pick a question before starting the timer.");
    }
    const clamp = Math.max(3, Math.min(60, Math.round(seconds)));
    await clearAnswers(ctx, roomId, room.questionIndex);
    await ctx.db.patch(roomId, {
      phase: "voting",
      roundStartedAt: Date.now(),
      timerMs: clamp * 1000,
      awarded: false,
      correctChoice: undefined,
    });
  },
});

/** Player: lock in a choice while the timer runs. */
export const submitAnswer = mutation({
  args: {
    roomId: v.id("gameRooms"),
    playerId: v.id("gamePlayers"),
    choice: v.number(),
  },
  handler: async (ctx, { roomId, playerId, choice }) => {
    const room = await ctx.db.get(roomId);
    if (!room) throw new Error("Room not found.");
    if (room.phase !== "voting") {
      throw new Error("Voting is not open right now.");
    }
    const endsAt = (room.roundStartedAt ?? 0) + (room.timerMs ?? 0);
    if (Date.now() > endsAt) {
      throw new Error("Time's up — that round is closed.");
    }
    if (choice < 0 || choice > 3) throw new Error("Pick one of the four options.");
    const player = await ctx.db.get(playerId);
    if (!player || player.roomId !== roomId) {
      throw new Error("You are not on this room's roster.");
    }
    const existing = await ctx.db
      .query("gameAnswers")
      .withIndex("by_room_player_q", (q) =>
        q.eq("roomId", roomId).eq("playerId", playerId).eq("questionIndex", room.questionIndex),
      )
      .unique();
    if (existing) {
      if (existing.choice !== choice) {
        await ctx.db.patch(existing._id, { choice });
      }
      return;
    }
    await ctx.db.insert("gameAnswers", {
      roomId,
      questionIndex: room.questionIndex,
      playerId,
      choice,
    });
  },
});

/** Operator: freeze the tally (manual, or automatically when the timer hits 0). */
export const lockVoting = mutation({
  args: { roomId: v.id("gameRooms") },
  handler: async (ctx, { roomId }) => {
    const room = await ctx.db.get(roomId);
    if (!room || room.phase !== "voting") return;
    await ctx.db.patch(roomId, { phase: "locked" });
  },
});

/**
 * Operator: "What's the answer?" — reveals the right option and, exactly once
 * per question, banks +1 star for every player who picked it.
 */
export const revealAnswer = mutation({
  args: { roomId: v.id("gameRooms"), correctChoice: v.number() },
  handler: async (ctx, { roomId, correctChoice }) => {
    const room = await ctx.db.get(roomId);
    if (!room) throw new Error("Room not found.");
    if (room.phase !== "locked" && room.phase !== "voting") {
      throw new Error("Open the round before revealing the answer.");
    }
    if (room.awarded) {
      await ctx.db.patch(roomId, {
        phase: "revealed",
        correctChoice,
      });
      return;
    }

    const answers = await ctx.db
      .query("gameAnswers")
      .withIndex("by_room_question", (q) =>
        q.eq("roomId", roomId).eq("questionIndex", room.questionIndex),
      )
      .collect();

    for (const answer of answers) {
      const isCorrect = answer.choice === correctChoice;
      await ctx.db.patch(answer._id, {
        correct: isCorrect,
        awarded: isCorrect,
      });
      if (isCorrect) {
        const player = await ctx.db.get(answer.playerId);
        if (player) {
          await ctx.db.patch(player._id, { stars: player.stars + 1 });
        }
      }
    }

    await ctx.db.patch(roomId, {
      phase: "revealed",
      awarded: true,
      correctChoice,
    });
  },
});

/** Operator: wipe answers + stars and return the room to the lobby. */
export const resetSession = mutation({
  args: { roomId: v.id("gameRooms") },
  handler: async (ctx, { roomId }) => {
    const answers = await ctx.db
      .query("gameAnswers")
      .withIndex("by_room_question", (q) => q.eq("roomId", roomId))
      .collect();
    for (const answer of answers) {
      await ctx.db.delete(answer._id);
    }
    const players = await ctx.db
      .query("gamePlayers")
      .withIndex("by_room", (q) => q.eq("roomId", roomId))
      .collect();
    for (const player of players) {
      await ctx.db.patch(player._id, { stars: 0 });
    }
    await ctx.db.patch(roomId, {
      phase: "lobby",
      questionIndex: 0,
      awarded: false,
      roundStartedAt: undefined,
      timerMs: undefined,
      correctChoice: undefined,
    });
  },
});

/**
 * Operator: live tally for the current question — counts plus the names behind
 * each bar. The correct option is only exposed once the room is revealed.
 */
export const getTally = query({
  args: { roomId: v.id("gameRooms"), questionIndex: v.number() },
  handler: async (ctx, { roomId, questionIndex }) => {
    const room = await ctx.db.get(roomId);
    if (!room) return null;
    const [answers, players] = await Promise.all([
      ctx.db
        .query("gameAnswers")
        .withIndex("by_room_question", (q) =>
          q.eq("roomId", roomId).eq("questionIndex", questionIndex),
        )
        .collect(),
      ctx.db
        .query("gamePlayers")
        .withIndex("by_room", (q) => q.eq("roomId", roomId))
        .collect(),
    ]);
    const nameById = new Map(players.map((p) => [p._id, p.name]));
    const counts = [0, 0, 0, 0];
    const names: string[][] = [[], [], [], []];
    for (const answer of answers) {
      if (answer.choice >= 0 && answer.choice < 4) {
        counts[answer.choice] += 1;
        names[answer.choice].push(nameById.get(answer.playerId) ?? "?");
      }
    }
    const revealed = room.phase === "revealed";
    const correct = room.correctChoice;
    return {
      counts,
      names,
      answered: answers.length,
      players: players.length,
      revealed,
      correctCount:
        revealed && correct !== undefined && correct !== null
          ? counts[correct] ?? 0
          : null,
    };
  },
});
