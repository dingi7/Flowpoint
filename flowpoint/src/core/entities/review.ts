import z from "zod";
import { baseEntitySchema } from "./base";

const reviewDataBaseSchema = z.object({
  appointmentId: z.string(),
  organizationId: z.string(),
  customerId: z.string(),
  rating: z.number().int().min(1).max(5),
  comment: z.string().optional(),
});

export const reviewDataSchema = reviewDataBaseSchema.refine(
  (data) => {
    // Validate comment length if provided
    if (data.comment === undefined) return true;
    return data.comment.trim().length <= 1000;
  },
  {
    message: "Comment must be 1000 characters or less",
    path: ["comment"],
  },
);

export type ReviewData = z.infer<typeof reviewDataSchema>;
export const reviewSchema = baseEntitySchema.merge(reviewDataBaseSchema);
export type Review = z.infer<typeof reviewSchema>;

