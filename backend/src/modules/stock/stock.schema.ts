import { z } from "zod";

export const stockTypeEnum = z.enum(["RAW_MATERIAL", "FINISHED_PRODUCT"]);
export const movementTypeEnum = z.enum(["IN", "OUT"]);

export const createStockItemSchema = z.object({
  type: stockTypeEnum,
  name: z.string().min(1, "Name is required"),
  ingredientId: z.number().int().positive().optional(),
  unit: z.string().min(1, "Unit is required"),
  currentStock: z.number().min(0, "Stock cannot be negative").default(0),
});

export type CreateStockItemInput = z.infer<typeof createStockItemSchema>;

export const updateStockItemSchema = z
  .object({
    name: z.string().min(1, "Name is required").optional(),
    unit: z.string().min(1, "Unit is required").optional(),
  })
  .refine(
    (data) => data.name !== undefined || data.unit !== undefined,
    { message: "At least one field must be provided" }
  );

export type UpdateStockItemInput = z.infer<typeof updateStockItemSchema>;

export const createMovementSchema = z.object({
  movementType: movementTypeEnum,
  quantity: z.number().positive("Quantity must be positive"),
  reason: z.string().min(1, "Reason is required"),
});

export type CreateMovementInput = z.infer<typeof createMovementSchema>;
