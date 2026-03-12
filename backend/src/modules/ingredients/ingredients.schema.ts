import { z } from "zod";

const unitEnum = z.enum(["KG", "G", "L", "ML", "UNIT"]);

export const createIngredientSchema = z.object({
  name: z.string().min(1, "Name is required"),
  unit: unitEnum,
  price: z.number().positive("Price must be positive"),
});

export type CreateIngredientInput = z.infer<typeof createIngredientSchema>;

export const updateIngredientSchema = z
  .object({
    name: z.string().min(1, "Name is required").optional(),
    unit: unitEnum.optional(),
    price: z.number().positive("Price must be positive").optional(),
  })
  .refine(
    (data) => data.name !== undefined || data.unit !== undefined || data.price !== undefined,
    { message: "At least one field must be provided" }
  );

export type UpdateIngredientInput = z.infer<typeof updateIngredientSchema>;

export const bulkUpdatePricesSchema = z.object({
  updates: z
    .array(
      z.object({
        id: z.number().int().positive(),
        price: z.number().positive("Price must be positive"),
      })
    )
    .min(1, "At least one update is required"),
});

export type BulkUpdatePricesInput = z.infer<typeof bulkUpdatePricesSchema>;
