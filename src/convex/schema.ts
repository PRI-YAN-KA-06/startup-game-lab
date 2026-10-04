import { authTables } from "@convex-dev/auth/server";
import { defineSchema, defineTable } from "convex/server";
import { Infer, v } from "convex/values";

// default user roles. can add / remove based on the project as needed
export const ROLES = {
  ADMIN: "admin",
  USER: "user",
  MEMBER: "member",
} as const;

export const roleValidator = v.union(
  v.literal(ROLES.ADMIN),
  v.literal(ROLES.USER),
  v.literal(ROLES.MEMBER),
);
export type Role = Infer<typeof roleValidator>;

const schema = defineSchema(
  {
    // default auth tables using convex auth.
    ...authTables, // do not remove or modify

    // the users table is the default users table that is brought in by the authTables
    users: defineTable({
      name: v.optional(v.string()), // name of the user. do not remove
      image: v.optional(v.string()), // image of the user. do not remove
      email: v.optional(v.string()), // email of the user. do not remove
      emailVerificationTime: v.optional(v.number()), // email verification time. do not remove
      isAnonymous: v.optional(v.boolean()), // is the user anonymous. do not remove

      role: v.optional(roleValidator), // role of the user. do not remove
    }).index("email", ["email"]), // index for the email. do not remove or modify

    // ---- Live game state (Startup School operator-led quiz) ----
    gameRooms: defineTable({
      code: v.string(), // 4-char join code shown next to the QR
      phase: v.union(
        v.literal("lobby"), // no question on screen
        v.literal("question"), // question shown, options still hidden
        v.literal("voting"), // 10s timer running, players picking
        v.literal("locked"), // timer over / operator closed, tally frozen
        v.literal("revealed"), // correct answer shown, stars awarded
      ),
      questionIndex: v.number(),
      totalQuestions: v.number(),
      roundStartedAt: v.optional(v.number()), // server clock when timer began
      timerMs: v.optional(v.number()),
      correctChoice: v.optional(v.number()), // set on reveal
      awarded: v.optional(v.boolean()), // star guard: once per question
      createdAt: v.number(),
    }).index("by_code", ["code"]),

    gamePlayers: defineTable({
      roomId: v.id("gameRooms"),
      name: v.string(),
      stars: v.number(), // cumulative across questions
      joinedAt: v.number(),
    })
      .index("by_room", ["roomId"])
      .index("by_room_name", ["roomId", "name"]),

    gameAnswers: defineTable({
      roomId: v.id("gameRooms"),
      questionIndex: v.number(),
      playerId: v.id("gamePlayers"),
      choice: v.number(),
      correct: v.optional(v.boolean()),
      awarded: v.optional(v.boolean()),
    })
      .index("by_room_question", ["roomId", "questionIndex"])
      .index("by_room_player_q", ["roomId", "playerId", "questionIndex"]),
  },
  {
    schemaValidation: false,
  },
);

export default schema;
