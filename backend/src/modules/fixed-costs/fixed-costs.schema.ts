import { z } from "zod";

export const createFixedCostSchema = z.object({
  name: z.string().min(1, "Name is required"),
  amount: z.number().positive("Amount must be positive"),
});

export type CreateFixedCostInput = z.infer<typeof createFixedCostSchema>;

export const updateFixedCostSchema = z
  .object({
    name: z.string().min(1, "Name is required").optional(),
    amount: z.number().positive("Amount must be positive").optional(),
  })
  .refine(
    (data) => data.name !== undefined || data.amount !== undefined,
    { message: "At least one field must be provided" }
  );

export type UpdateFixedCostInput = z.infer<typeof updateFixedCostSchema>;
