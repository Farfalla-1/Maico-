import { z } from "zod";

export const recipeIngredientSchema = z.object({
  ingredientId: z.number().int().positive(),
  quantity: z.number().positive("Quantity must be positive"),
});

export const recipeStepSchema = z.object({
  stepNumber: z.number().int().positive(),
  description: z.string().min(1, "Step description is required"),
});

export const createRecipeSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  image: z.string().optional(),
  yield: z.number().int().positive("Yield must be a positive integer"),
  yieldUnit: z.string().min(1, "Yield unit is required"),
  ingredients: z
    .array(recipeIngredientSchema)
    .min(1, "At least one ingredient is required"),
  steps: z
    .array(recipeStepSchema)
    .min(1, "At least one step is required"),
});

export type CreateRecipeInput = z.infer<typeof createRecipeSchema>;

export const updateRecipeSchema = z.object({
  name: z.string().min(1, "Name is required").optional(),
  description: z.string().optional(),
  image: z.string().optional(),
  yield: z.number().int().positive("Yield must be a positive integer").optional(),
  yieldUnit: z.string().min(1, "Yield unit is required").optional(),
  ingredients: z
    .array(recipeIngredientSchema)
    .min(1, "At least one ingredient is required")
    .optional(),
  steps: z
    .array(recipeStepSchema)
    .min(1, "At least one step is required")
    .optional(),
});

export type UpdateRecipeInput = z.infer<typeof updateRecipeSchema>;
