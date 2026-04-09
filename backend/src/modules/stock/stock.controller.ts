import { Request, Response } from "express";
import { asyncHandler, parseId } from "../../common/helpers.js";
import { createStockItemSchema, updateStockItemSchema, createMovementSchema } from "./stock.schema.js";
import * as stockService from "./stock.service.js";

export const getAllHandler = asyncHandler(async (req: Request, res: Response) => {
  const type = req.query.type as string | undefined;
  const data = await stockService.getAll(type);
  res.json({ status: "success", data });
});

export const getByIdHandler = asyncHandler(async (req: Request, res: Response) => {
  const id = parseId(req.params.id);
  const data = await stockService.getById(id);
  res.json({ status: "success", data });
});

export const createHandler = asyncHandler(async (req: Request, res: Response) => {
  const input = createStockItemSchema.parse(req.body);
  const data = await stockService.create(input);
  res.status(201).json({ status: "success", data });
});

export const updateHandler = asyncHandler(async (req: Request, res: Response) => {
  const id = parseId(req.params.id);
  const input = updateStockItemSchema.parse(req.body);
  const data = await stockService.update(id, input);
  res.json({ status: "success", data });
});

export const deleteHandler = asyncHandler(async (req: Request, res: Response) => {
  const id = parseId(req.params.id);
  await stockService.remove(id);
  res.json({ status: "success", message: "Stock item deleted" });
});

export const addMovementHandler = asyncHandler(async (req: Request, res: Response) => {
  const stockItemId = parseId(req.params.id);
  const input = createMovementSchema.parse(req.body);
  const data = await stockService.addMovement(stockItemId, input);
  res.status(201).json({ status: "success", data });
});

export const getMovementsHandler = asyncHandler(async (req: Request, res: Response) => {
  const stockItemId = parseId(req.params.id);
  const data = await stockService.getMovements(stockItemId);
  res.json({ status: "success", data });
});
