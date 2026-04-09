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
    include: {
      saleItems: { include: { stockItem: true } },
      extraCharges: true,
    },
    orderBy: { date: "desc" },
  });
}

export async function create(data: CreateLedgerEntryInput) {
  const hasStockMovements = data.stockMovements && data.stockMovements.length > 0;
  const hasSaleItems = data.saleItems && data.saleItems.length > 0;
  const hasExtraCharges = data.extraCharges && data.extraCharges.length > 0;

  // Simple case: no linked items
  if (!hasStockMovements && !hasSaleItems && !hasExtraCharges) {
    return prisma.ledgerEntry.create({
      data: {
        type: data.type,
        description: data.description,
        amount: data.amount,
        date: new Date(data.date),
        category: data.category ?? null,
      },
      include: {
        saleItems: { include: { stockItem: true } },
        extraCharges: true,
      },
    });
  }

  return prisma.$transaction(async (tx) => {
    const entry = await tx.ledgerEntry.create({
      data: {
        type: data.type,
        description: data.description,
        amount: data.amount,
        date: new Date(data.date),
        category: data.category ?? null,
      },
    });

    // EXPENSE: stock movements IN (bought supplies)
    if (hasStockMovements) {
      for (const sm of data.stockMovements!) {
        const stockItem = await tx.stockItem.findUnique({ where: { id: sm.stockItemId } });
        if (!stockItem) {
          throw new AppError(`Stock item ${sm.stockItemId} not found`, 404);
        }

        const newStock = Number(stockItem.currentStock) + sm.quantity;

        await tx.stockMovement.create({
          data: {
            stockItemId: sm.stockItemId,
            movementType: "IN",
            quantity: sm.quantity,
            reason: "Compra",
            ledgerEntryId: entry.id,
          },
        });

        await tx.stockItem.update({
          where: { id: sm.stockItemId },
          data: { currentStock: newStock },
        });
      }
    }

    // INCOME: sale items (products sold, optionally deduct stock)
    if (hasSaleItems) {
      for (const si of data.saleItems!) {
        const stockItem = await tx.stockItem.findUnique({ where: { id: si.stockItemId } });
        if (!stockItem) {
          throw new AppError(`Stock item ${si.stockItemId} not found`, 404);
        }

        // Save the sale item record (always, for metrics)
        await tx.ledgerSaleItem.create({
          data: {
            ledgerEntryId: entry.id,
            stockItemId: si.stockItemId,
            quantity: si.quantity,
            deductStock: si.deductStock,
          },
        });

        // Only deduct stock if checked
        if (si.deductStock) {
          const newStock = Number(stockItem.currentStock) - si.quantity;

          if (newStock < 0) {
            throw new AppError(`Stock insuficiente para "${stockItem.name}"`, 400);
          }

          await tx.stockMovement.create({
            data: {
              stockItemId: si.stockItemId,
              movementType: "OUT",
              quantity: si.quantity,
              reason: "Venta",
              ledgerEntryId: entry.id,
            },
          });

          await tx.stockItem.update({
            where: { id: si.stockItemId },
            data: { currentStock: newStock },
          });
        }
      }
    }

    // Extra charges (e.g., delivery)
    if (hasExtraCharges) {
      for (const ec of data.extraCharges!) {
        await tx.ledgerExtraCharge.create({
          data: {
            ledgerEntryId: entry.id,
            description: ec.description,
            amount: ec.amount,
          },
        });
      }
    }

    return tx.ledgerEntry.findUnique({
      where: { id: entry.id },
      include: {
        saleItems: { include: { stockItem: true } },
        extraCharges: true,
      },
    });
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
