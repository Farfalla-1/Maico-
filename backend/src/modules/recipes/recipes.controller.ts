import { Request, Response } from "express";
import { createRecipeSchema, updateRecipeSchema } from "./recipes.schema.js";
import * as recipesService from "./recipes.service.js";
import { asyncHandler, parseId } from "../../common/helpers.js";

export const getAllHandler = asyncHandler(async (_req: Request, res: Response) => {
  const recipes = await recipesService.getAll();
  res.json({ status: "success", data: recipes });
});

export const getByIdHandler = asyncHandler(async (req: Request, res: Response) => {
  const id = parseId(req.params.id);
  const recipe = await recipesService.getById(id);
  res.json({ status: "success", data: recipe });
});

export const createHandler = asyncHandler(async (req: Request, res: Response) => {
  const data = createRecipeSchema.parse(req.body);
  const recipe = await recipesService.create(data);
  res.status(201).json({ status: "success", data: recipe });
});

export const updateHandler = asyncHandler(async (req: Request, res: Response) => {
  const id = parseId(req.params.id);
  const data = updateRecipeSchema.parse(req.body);
  const recipe = await recipesService.update(id, data);
  res.json({ status: "success", data: recipe });
});

export const removeHandler = asyncHandler(async (req: Request, res: Response) => {
  const id = parseId(req.params.id);
  await recipesService.remove(id);
  res.json({ status: "success", message: "Recipe deleted" });
});
