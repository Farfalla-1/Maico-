import { prisma } from "../../common/db.js";
import { AppError } from "../../common/errors.js";
import { CreateIngredientInput, UpdateIngredientInput, BulkUpdatePricesInput } from "./ingredients.schema.js";

export async function getAll() {
  return prisma.ingredient.findMany({
    orderBy: { name: "asc" },
  });
}

export async function getById(id: number) {
  const ingredient = await prisma.ingredient.findUnique({
    where: { id },
    include: { priceHistory: { orderBy: { recordedAt: "desc" } } },
  });

  if (!ingredient) {
    throw new AppError("Ingredient not found", 404);
  }

  return ingredient;
}

export async function create(data: CreateIngredientInput) {
  return prisma.$transaction(async (tx) => {
    const ingredient = await tx.ingredient.create({
      data: {
        name: data.name,
        unit: data.unit,
        price: data.price,
      },
    });

    await tx.stockItem.create({
      data: {
        type: "RAW_MATERIAL",
        name: ingredient.name,
        ingredientId: ingredient.id,
        unit: ingredient.unit,
        currentStock: 0,
      },
    });

    return ingredient;
  });
}

export async function update(id: number, data: UpdateIngredientInput) {
  const existing = await prisma.ingredient.findUnique({ where: { id } });

  if (!existing) {
    throw new AppError("Ingredient not found", 404);
  }

  const priceChanged = data.price !== undefined && Number(existing.price) !== data.price;

  return prisma.$transaction(async (tx) => {
    if (priceChanged) {
      await tx.priceHistory.create({
        data: {
          ingredientId: id,
          price: existing.price,
        },
      });
    }

    const updated = await tx.ingredient.update({
      where: { id },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.unit !== undefined && { unit: data.unit }),
        ...(data.price !== undefined && { price: data.price }),
      },
    });

    // Keep StockItem in sync
    if (data.name !== undefined || data.unit !== undefined) {
      await tx.stockItem.updateMany({
        where: { type: "RAW_MATERIAL", ingredientId: id },
        data: {
          ...(data.name !== undefined && { name: data.name }),
          ...(data.unit !== undefined && { unit: data.unit }),
        },
      });
    }

    return updated;
  });
}

export async function bulkUpdatePrices(data: BulkUpdatePricesInput) {
  return prisma.$transaction(async (tx) => {
    const results = [];
    for (const item of data.updates) {
      const existing = await tx.ingredient.findUnique({ where: { id: item.id } });
      if (!existing) throw new AppError(`Ingredient with id ${item.id} not found`, 404);

      if (Number(existing.price) !== item.price) {
        await tx.priceHistory.create({
          data: { ingredientId: item.id, price: existing.price },
        });
        const updated = await tx.ingredient.update({
          where: { id: item.id },
          data: { price: item.price },
        });
        results.push(updated);
      } else {
        results.push(existing);
      }
    }
    return results;
  });
}

export async function remove(id: number) {
  const existing = await prisma.ingredient.findUnique({ where: { id } });

  if (!existing) {
    throw new AppError("Ingredient not found", 404);
  }

  return prisma.ingredient.delete({ where: { id } });
}
