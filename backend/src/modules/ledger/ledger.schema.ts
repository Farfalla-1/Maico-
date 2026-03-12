import { z } from "zod";

export const ledgerTypeEnum = z.enum(["INCOME", "EXPENSE"]);

export const createLedgerEntrySchema = z.object({
  type: ledgerTypeEnum,
  description: z.string().min(1, "Description is required"),
  amount: z.number().positive("Amount must be positive"),
  date: z.string().refine((val) => !isNaN(Date.parse(val)), "Invalid date"),
  category: z.string().optional(),
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
