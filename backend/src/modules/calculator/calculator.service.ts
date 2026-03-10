import { prisma } from "../../common/db.js";
import { AppError } from "../../common/errors.js";

interface BreakdownItem {
  ingredientName: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  subtotal: number;
}

interface FixedCostItem {
  name: string;
  amount: number;
}

interface CostCalculation {
  recipeName: string;
  yield: number;
  yieldUnit: string;
  ingredientsCost: number;
  fixedCostsTotal: number;
  totalCost: number;
  costPerUnit: number;
  marginPercent: number;
  suggestedPrice: number;
  breakdown: BreakdownItem[];
  fixedCosts: FixedCostItem[];
}

function convertToBaseUnit(quantity: number, fromUnit: string, toUnit: string): number {
  if (fromUnit === toUnit) return quantity;

  if (fromUnit === "G" && toUnit === "KG") return quantity / 1000;
  if (fromUnit === "KG" && toUnit === "G") return quantity * 1000;
  if (fromUnit === "ML" && toUnit === "L") return quantity / 1000;
  if (fromUnit === "L" && toUnit === "ML") return quantity * 1000;

  return quantity;
}

export async function calculateRecipeCost(
  recipeId: number,
  marginPercent: number
): Promise<CostCalculation> {
  const [recipe, fixedCostsData] = await Promise.all([
    prisma.recipe.findUnique({
      where: { id: recipeId },
      include: {
        ingredients: {
          include: { ingredient: true },
        },
      },
    }),
    prisma.fixedCost.findMany({ orderBy: { name: "asc" } }),
  ]);

  if (!recipe) {
    throw new AppError("Recipe not found", 404);
  }

  const breakdown: BreakdownItem[] = recipe.ingredients.map((ri) => {
    const pricePerBaseUnit = Number(ri.ingredient.price);
    const recipeQuantity = Number(ri.quantity);
    const recipeUnit = ri.unit;
    const ingredientUnit = ri.ingredient.unit;

    const quantityInBaseUnit = convertToBaseUnit(recipeQuantity, recipeUnit, ingredientUnit);
    const subtotal = pricePerBaseUnit * quantityInBaseUnit;

    return {
      ingredientName: ri.ingredient.name,
      quantity: recipeQuantity,
      unit: recipeUnit,
      unitPrice: pricePerBaseUnit,
      subtotal,
    };
  });

  const fixedCosts: FixedCostItem[] = fixedCostsData.map((fc) => ({
    name: fc.name,
    amount: Number(fc.amount),
  }));

  const ingredientsCost = breakdown.reduce((sum, item) => sum + item.subtotal, 0);
  const fixedCostsTotal = fixedCosts.reduce((sum, item) => sum + item.amount, 0);
  const totalCost = ingredientsCost + fixedCostsTotal;
  const costPerUnit = totalCost / recipe.yield;
  const suggestedPrice = costPerUnit * (1 + marginPercent / 100);

  return {
    recipeName: recipe.name,
    yield: recipe.yield,
    yieldUnit: recipe.yieldUnit,
    ingredientsCost,
    fixedCostsTotal,
    totalCost,
    costPerUnit,
    marginPercent,
    suggestedPrice,
    breakdown,
    fixedCosts,
  };
}
