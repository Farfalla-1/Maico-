import { z } from "zod";

export const calculateCostSchema = z.object({
  recipeId: z.number().int().positive(),
  marginPercent: z.number().default(0),
});

export type CalculateCostInput = z.infer<typeof calculateCostSchema>;
