import z from "zod";

export const bookingSuggestionSchema = z.object({
  serviceId: z.string(),
  name: z.string(),
  description: z.string().optional(),
  price: z.number(),
  duration: z.number(),
  reason: z.string(),
  source: z.enum(["ai", "history", "rule"]),
});

export type BookingSuggestion = z.infer<typeof bookingSuggestionSchema>;
