import { Request, Response } from "express";
import { calculateCostSchema } from "./calculator.schema.js";
import * as calculatorService from "./calculator.service.js";
import { asyncHandler } from "../../common/helpers.js";

export const calculateHandler = asyncHandler(async (req: Request, res: Response) => {
  const { recipeId, marginPercent } = calculateCostSchema.parse(req.body);
  const result = await calculatorService.calculateRecipeCost(recipeId, marginPercent);
  res.json({ status: "success", data: result });
});
