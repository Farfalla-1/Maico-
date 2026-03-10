import { prisma } from "../../common/db.js";
import { AppError } from "../../common/errors.js";
import { CreateIngredientInput, UpdateIngredientInput } from "./ingredients.schema.js";

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
  return prisma.ingredient.create({
    data: {
      name: data.name,
      unit: data.unit,
      price: data.price,
    },
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

    return tx.ingredient.update({
      where: { id },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.unit !== undefined && { unit: data.unit }),
        ...(data.price !== undefined && { price: data.price }),
      },
    });
  });
}

export async function remove(id: number) {
  const existing = await prisma.ingredient.findUnique({ where: { id } });

  if (!existing) {
    throw new AppError("Ingredient not found", 404);
  }

  return prisma.ingredient.delete({ where: { id } });
}
