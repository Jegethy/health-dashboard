import { z } from "zod";

const optionalNonNegativeInt = z
  .union([z.coerce.number().int().min(0), z.literal(""), z.null(), z.undefined()])
  .transform((value) => (value === "" || value == null ? null : value));

const optionalNonNegativeNumber = z
  .union([z.coerce.number().min(0), z.literal(""), z.null(), z.undefined()])
  .transform((value) => (value === "" || value == null ? null : value));

export const entryInputSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD format."),
  weightKg: optionalNonNegativeNumber,
  steps: optionalNonNegativeInt,
  caloriesEaten: optionalNonNegativeInt.optional().default(null),
  caloriesBurned: optionalNonNegativeInt,
  notes: z.string().trim().max(2000).optional().default(""),
});

export type EntryInput = z.infer<typeof entryInputSchema>;
