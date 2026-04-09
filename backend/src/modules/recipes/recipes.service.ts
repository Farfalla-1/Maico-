import { prisma } from "../../common/db.js";
import { AppError } from "../../common/errors.js";
import { CreateRecipeInput, UpdateRecipeInput } from "./recipes.schema.js";

export async function getAll() {
  return prisma.recipe.findMany({
    include: {
      ingredients: {
        include: {
          ingredient: true,
        },
      },
      steps: {
        orderBy: { stepNumber: "asc" },
      },
    },
    orderBy: { name: "asc" },
  });
}

export async function getById(id: number) {
  const recipe = await prisma.recipe.findUnique({
    where: { id },
    include: {
      ingredients: {
        include: {
          ingredient: true,
        },
      },
      steps: {
        orderBy: { stepNumber: "asc" },
      },
    },
  });

  if (!recipe) {
    throw new AppError("Recipe not found", 404);
  }

  return recipe;
}

export async function create(data: CreateRecipeInput) {
  return prisma.$transaction(async (tx) => {
    const recipe = await tx.recipe.create({
      data: {
        name: data.name,
        description: data.description,
        image: data.image,
        yield: data.yield,
        yieldUnit: data.yieldUnit,
        ingredients: {
          create: data.ingredients.map((ing) => ({
            ingredientId: ing.ingredientId,
            quantity: ing.quantity,
            unit: ing.unit,
          })),
        },
        steps: {
          create: data.steps.map((step) => ({
            stepNumber: step.stepNumber,
            description: step.description,
          })),
        },
      },
      include: {
        ingredients: {
          include: {
            ingredient: true,
          },
        },
        steps: {
          orderBy: { stepNumber: "asc" },
        },
      },
    });

    await tx.stockItem.create({
      data: {
        type: "FINISHED_PRODUCT",
        name: recipe.name,
        recipeId: recipe.id,
        unit: recipe.yieldUnit,
        currentStock: 0,
      },
    });

    return recipe;
  });
}

export async function update(id: number, data: UpdateRecipeInput) {
  const existing = await prisma.recipe.findUnique({ where: { id } });

  if (!existing) {
    throw new AppError("Recipe not found", 404);
  }

  return prisma.$transaction(async (tx) => {
    if (data.ingredients) {
      await tx.recipeIngredient.deleteMany({ where: { recipeId: id } });
      await tx.recipeIngredient.createMany({
        data: data.ingredients.map((ing) => ({
          recipeId: id,
          ingredientId: ing.ingredientId,
          quantity: ing.quantity,
          unit: ing.unit,
        })),
      });
    }

    if (data.steps) {
      await tx.recipeStep.deleteMany({ where: { recipeId: id } });
      await tx.recipeStep.createMany({
        data: data.steps.map((step) => ({
          recipeId: id,
          stepNumber: step.stepNumber,
          description: step.description,
        })),
      });
    }

    const updated = await tx.recipe.update({
      where: { id },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.image !== undefined && { image: data.image }),
        ...(data.yield !== undefined && { yield: data.yield }),
        ...(data.yieldUnit !== undefined && { yieldUnit: data.yieldUnit }),
      },
      include: {
        ingredients: {
          include: {
            ingredient: true,
          },
        },
        steps: {
          orderBy: { stepNumber: "asc" },
        },
      },
    });

    // Keep StockItem in sync
    if (data.name !== undefined || data.yieldUnit !== undefined) {
      await tx.stockItem.updateMany({
        where: { type: "FINISHED_PRODUCT", recipeId: id },
        data: {
          ...(data.name !== undefined && { name: data.name }),
          ...(data.yieldUnit !== undefined && { unit: data.yieldUnit }),
        },
      });
    }

    return updated;
  });
}

export async function remove(id: number) {
  const existing = await prisma.recipe.findUnique({ where: { id } });

  if (!existing) {
    throw new AppError("Recipe not found", 404);
  }

  return prisma.recipe.delete({ where: { id } });
}
