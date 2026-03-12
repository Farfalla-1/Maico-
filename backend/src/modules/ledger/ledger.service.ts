import { prisma } from "../../common/db.js";
import { AppError } from "../../common/errors.js";
import { CreateLedgerEntryInput, UpdateLedgerEntryInput } from "./ledger.schema.js";

export async function getAll(filters?: { month?: number; year?: number; type?: string }) {
  const where: Record<string, unknown> = {};

  if (filters?.type === "INCOME" || filters?.type === "EXPENSE") {
    where.type = filters.type;
  }

  if (filters?.year) {
    const month = filters.month ?? 1;
    const startDate = new Date(filters.year, (filters.month ? month - 1 : 0), 1);
    const endDate = filters.month
      ? new Date(filters.year, month, 1)
      : new Date(filters.year + 1, 0, 1);

    where.date = { gte: startDate, lt: endDate };
  }

  return prisma.ledgerEntry.findMany({
    where,
    orderBy: { date: "desc" },
  });
}

export async function create(data: CreateLedgerEntryInput) {
  return prisma.ledgerEntry.create({
    data: {
      type: data.type,
      description: data.description,
      amount: data.amount,
      date: new Date(data.date),
      category: data.category ?? null,
    },
  });
}

export async function update(id: number, data: UpdateLedgerEntryInput) {
  const existing = await prisma.ledgerEntry.findUnique({ where: { id } });
  if (!existing) throw new AppError("Ledger entry not found", 404);

  const updateData: Record<string, unknown> = {};
  if (data.type !== undefined) updateData.type = data.type;
  if (data.description !== undefined) updateData.description = data.description;
  if (data.amount !== undefined) updateData.amount = data.amount;
  if (data.date !== undefined) updateData.date = new Date(data.date);
  if (data.category !== undefined) updateData.category = data.category;

  return prisma.ledgerEntry.update({ where: { id }, data: updateData });
}

export async function remove(id: number) {
  const existing = await prisma.ledgerEntry.findUnique({ where: { id } });
  if (!existing) throw new AppError("Ledger entry not found", 404);

  return prisma.ledgerEntry.delete({ where: { id } });
}

export async function getSummary(month?: number, year?: number) {
  const entries = await getAll({ month, year });

  let totalIncome = 0;
  let totalExpense = 0;

  for (const entry of entries) {
    const amount = Number(entry.amount);
    if (entry.type === "INCOME") {
      totalIncome += amount;
    } else {
      totalExpense += amount;
    }
  }

  return {
    totalIncome,
    totalExpense,
    balance: totalIncome - totalExpense,
    count: entries.length,
  };
}
