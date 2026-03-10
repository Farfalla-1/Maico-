import { Request, Response } from "express";
import { createIngredientSchema, updateIngredientSchema } from "./ingredients.schema.js";
import * as ingredientsService from "./ingredients.service.js";
import { asyncHandler, parseId } from "../../common/helpers.js";

export const getAllHandler = asyncHandler(async (_req: Request, res: Response) => {
  const ingredients = await ingredientsService.getAll();
  res.json({ status: "success", data: ingredients });
});

export const getByIdHandler = asyncHandler(async (req: Request, res: Response) => {
  const id = parseId(req.params.id);
  const ingredient = await ingredientsService.getById(id);
  res.json({ status: "success", data: ingredient });
});

export const createHandler = asyncHandler(async (req: Request, res: Response) => {
  const data = createIngredientSchema.parse(req.body);
  const ingredient = await ingredientsService.create(data);
  res.status(201).json({ status: "success", data: ingredient });
});

export const updateHandler = asyncHandler(async (req: Request, res: Response) => {
  const id = parseId(req.params.id);
  const data = updateIngredientSchema.parse(req.body);
  const ingredient = await ingredientsService.update(id, data);
  res.json({ status: "success", data: ingredient });
});

export const removeHandler = asyncHandler(async (req: Request, res: Response) => {
  const id = parseId(req.params.id);
  await ingredientsService.remove(id);
  res.json({ status: "success", message: "Ingredient deleted" });
});
