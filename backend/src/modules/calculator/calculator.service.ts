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

/**
 * Convert a quantity from one unit to the ingredient's base unit.
 * E.g., ingredient is priced per KG ($5000/KG), recipe uses 195 G
 * → convertToBaseUnit(195, "G", "KG") = 0.195 KG
 * Then cost = 0.195 * $5000 = $975
 */
function convertToBaseUnit(quantity: number, fromUnit: string, toUnit: string): number {
  if (fromUnit === toUnit) return quantity;

  // Weight conversions
  if (fromUnit === "G" && toUnit === "KG") return quantity / 1000;
  if (fromUnit === "KG" && toUnit === "G") return quantity * 1000;

  // Volume conversions
  if (fromUnit === "ML" && toUnit === "L") return quantity / 1000;
  if (fromUnit === "L" && toUnit === "ML") return quantity * 1000;

  // Incompatible units (e.g., G to L) — no conversion possible
  return quantity;
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
    const pricePerBaseUnit = Number(ri.ingredient.price);
    const recipeQuantity = Number(ri.quantity);
    const recipeUnit = ri.unit;
    const ingredientUnit = ri.ingredient.unit;

    // Convert recipe quantity to ingredient's base unit for cost calculation
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
