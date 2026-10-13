const {z} = require("zod");

const createInterviewSchema = z
.object({
    title: z.string().trim().min(3).max(150),

    description : z.string().trim().max(2000).optional().default(""),

    problemIds: z
        .array(z.string().regex(/^[a-f\d]{24}$/i, "invalid problem ID")
    )
    .max(20)
    .optional()
    .default([]),

    scheduledAt : z
       .string()
       .datetime({offset:true})
       .optional()
       .nullable()
       .default(null),

       durationMinutes : z.number().int().min(1).max(480).optional().default(60)
})
  .strict();

const joinInterviewSchema = z
        .object({
            roomCode : z
              .string()
              .trim()
              .toUpperCase()
              .regex(/^CC-[A-F0-9]{8}$/, "Invalid room code"),
        })
        .strict();

module.exports ={
    createInterviewSchema,
    joinInterviewSchema,
}