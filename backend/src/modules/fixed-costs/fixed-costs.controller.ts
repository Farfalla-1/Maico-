import { Request, Response } from "express";
import { asyncHandler, parseId } from "../../common/helpers.js";
import { createFixedCostSchema, updateFixedCostSchema } from "./fixed-costs.schema.js";
import * as fixedCostsService from "./fixed-costs.service.js";

export const getAllHandler = asyncHandler(async (_req: Request, res: Response) => {
  const data = await fixedCostsService.getAll();
  res.json({ status: "success", data });
});

export const createHandler = asyncHandler(async (req: Request, res: Response) => {
  const input = createFixedCostSchema.parse(req.body);
  const data = await fixedCostsService.create(input);
  res.status(201).json({ status: "success", data });
});

export const updateHandler = asyncHandler(async (req: Request, res: Response) => {
  const id = parseId(req.params.id);
  const input = updateFixedCostSchema.parse(req.body);
  const data = await fixedCostsService.update(id, input);
  res.json({ status: "success", data });
});

export const deleteHandler = asyncHandler(async (req: Request, res: Response) => {
  const id = parseId(req.params.id);
  await fixedCostsService.remove(id);
  res.json({ status: "success", message: "Fixed cost deleted" });
});
