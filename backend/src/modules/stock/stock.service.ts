import { prisma } from "../../common/db.js";
import { AppError } from "../../common/errors.js";
import { CreateStockItemInput, UpdateStockItemInput, CreateMovementInput } from "./stock.schema.js";

export async function getAll(type?: string) {
  const where: Record<string, unknown> = {};
  if (type === "RAW_MATERIAL" || type === "FINISHED_PRODUCT") {
    where.type = type;
  }

  return prisma.stockItem.findMany({
    where,
    include: { ingredient: true, recipe: true },
    orderBy: { name: "asc" },
  });
}

export async function getById(id: number) {
  const item = await prisma.stockItem.findUnique({
    where: { id },
    include: {
      ingredient: true,
      movements: {
        orderBy: { createdAt: "desc" },
        take: 20,
        include: { ledgerEntry: true },
      },
    },
  });
  if (!item) throw new AppError("Stock item not found", 404);
  return item;
}

export async function create(data: CreateStockItemInput) {
  if (data.type === "RAW_MATERIAL") {
    if (!data.ingredientId) {
      throw new AppError("ingredientId is required for raw materials", 400);
    }
    const ingredient = await prisma.ingredient.findUnique({
      where: { id: data.ingredientId },
    });
    if (!ingredient) throw new AppError("Ingredient not found", 404);
  }

  return prisma.stockItem.create({
    data: {
      type: data.type,
      name: data.name,
      ingredientId: data.type === "RAW_MATERIAL" ? data.ingredientId : null,
      unit: data.unit,
      currentStock: data.currentStock ?? 0,
    },
    include: { ingredient: true, recipe: true },
  });
}

export async function update(id: number, data: UpdateStockItemInput) {
  const existing = await prisma.stockItem.findUnique({ where: { id } });
  if (!existing) throw new AppError("Stock item not found", 404);

  return prisma.stockItem.update({
    where: { id },
    data,
    include: { ingredient: true, recipe: true },
  });
}

export async function remove(id: number) {
  const existing = await prisma.stockItem.findUnique({ where: { id } });
  if (!existing) throw new AppError("Stock item not found", 404);

  return prisma.stockItem.delete({ where: { id } });
}

export async function addMovement(stockItemId: number, data: CreateMovementInput) {
  const item = await prisma.stockItem.findUnique({ where: { id: stockItemId } });
  if (!item) throw new AppError("Stock item not found", 404);

  const delta = data.movementType === "IN" ? data.quantity : -data.quantity;
  const newStock = Number(item.currentStock) + delta;

  if (newStock < 0) {
    throw new AppError("Insufficient stock for this movement", 400);
  }

  return prisma.$transaction(async (tx) => {
    const movement = await tx.stockMovement.create({
      data: {
        stockItemId,
        movementType: data.movementType,
        quantity: data.quantity,
        reason: data.reason,
      },
    });

    await tx.stockItem.update({
      where: { id: stockItemId },
      data: { currentStock: newStock },
    });

    return movement;
  });
}

export async function getMovements(stockItemId: number) {
  const item = await prisma.stockItem.findUnique({ where: { id: stockItemId } });
  if (!item) throw new AppError("Stock item not found", 404);

  return prisma.stockMovement.findMany({
    where: { stockItemId },
    orderBy: { createdAt: "desc" },
    include: { ledgerEntry: true },
  });
}
