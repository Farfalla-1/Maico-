import { prisma } from "../../common/db.js";
import { AppError } from "../../common/errors.js";

interface BreakdownItem {
  ingredientName: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  subtotal: number;
}

interface CostCalculation {
  recipeName: string;
  yield: number;
  yieldUnit: string;
  totalCost: number;
  costPerUnit: number;
  marginPercent: number;
  suggestedPrice: number;
  breakdown: BreakdownItem[];
}

export async function calculateRecipeCost(
  recipeId: number,
  marginPercent: number
): Promise<CostCalculation> {
  const recipe = await prisma.recipe.findUnique({
    where: { id: recipeId },
    include: {
      ingredients: {
        include: {
          ingredient: true,
        },
      },
    },
  });

  if (!recipe) {
    throw new AppError("Recipe not found", 404);
  }

  const breakdown: BreakdownItem[] = recipe.ingredients.map((ri) => {
    const unitPrice = Number(ri.ingredient.price);
    const quantity = Number(ri.quantity);
    const subtotal = unitPrice * quantity;

    return {
      ingredientName: ri.ingredient.name,
      quantity,
      unit: ri.ingredient.unit,
      unitPrice,
      subtotal,
    };
  });

  const totalCost = breakdown.reduce((sum, item) => sum + item.subtotal, 0);
  const costPerUnit = totalCost / recipe.yield;
  const suggestedPrice = costPerUnit * (1 + marginPercent / 100);

  return {
    recipeName: recipe.name,
    yield: recipe.yield,
    yieldUnit: recipe.yieldUnit,
    totalCost,
    costPerUnit,
    marginPercent,
    suggestedPrice,
    breakdown,
  };
}
