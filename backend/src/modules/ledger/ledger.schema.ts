import { z } from "zod";

export const ledgerTypeEnum = z.enum(["INCOME", "EXPENSE"]);

// For EXPENSE entries: link purchases to raw material stock (IN)
const stockMovementItemSchema = z.object({
  stockItemId: z.number().int().positive(),
  quantity: z.number().positive("Quantity must be positive"),
});

// For INCOME entries: products sold (with optional stock deduction)
const saleItemSchema = z.object({
  stockItemId: z.number().int().positive(),
  quantity: z.number().positive("Quantity must be positive"),
  deductStock: z.boolean().default(true),
});

// Extra charges on a sale (e.g., delivery fee)
const extraChargeSchema = z.object({
  description: z.string().min(1, "Description is required"),
  amount: z.number().positive("Amount must be positive"),
});

export const createLedgerEntrySchema = z.object({
  type: ledgerTypeEnum,
  description: z.string().min(1, "Description is required"),
  amount: z.number().positive("Amount must be positive"),
  date: z.string().refine((val) => !isNaN(Date.parse(val)), "Invalid date"),
  category: z.string().optional(),
  stockMovements: z.array(stockMovementItemSchema).optional(),
  saleItems: z.array(saleItemSchema).optional(),
  extraCharges: z.array(extraChargeSchema).optional(),
});

export type CreateLedgerEntryInput = z.infer<typeof createLedgerEntrySchema>;

export const updateLedgerEntrySchema = z
  .object({
    type: ledgerTypeEnum.optional(),
    description: z.string().min(1, "Description is required").optional(),
    amount: z.number().positive("Amount must be positive").optional(),
    date: z.string().refine((val) => !isNaN(Date.parse(val)), "Invalid date").optional(),
    category: z.string().nullable().optional(),
  })
  .refine(
    (data) =>
      data.type !== undefined ||
      data.description !== undefined ||
      data.amount !== undefined ||
      data.date !== undefined ||
      data.category !== undefined,
    { message: "At least one field must be provided" }
  );

export type UpdateLedgerEntryInput = z.infer<typeof updateLedgerEntrySchema>;
