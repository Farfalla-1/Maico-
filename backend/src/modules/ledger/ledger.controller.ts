import { Request, Response } from "express";
import { asyncHandler, parseId } from "../../common/helpers.js";
import { createLedgerEntrySchema, updateLedgerEntrySchema } from "./ledger.schema.js";
import * as ledgerService from "./ledger.service.js";

export const getAllHandler = asyncHandler(async (req: Request, res: Response) => {
  const month = req.query.month ? Number(req.query.month) : undefined;
  const year = req.query.year ? Number(req.query.year) : undefined;
  const type = req.query.type as string | undefined;

  const data = await ledgerService.getAll({ month, year, type });
  res.json({ status: "success", data });
});

export const getSummaryHandler = asyncHandler(async (req: Request, res: Response) => {
  const month = req.query.month ? Number(req.query.month) : undefined;
  const year = req.query.year ? Number(req.query.year) : undefined;

  const data = await ledgerService.getSummary(month, year);
  res.json({ status: "success", data });
});

export const createHandler = asyncHandler(async (req: Request, res: Response) => {
  const input = createLedgerEntrySchema.parse(req.body);
  const data = await ledgerService.create(input);
  res.status(201).json({ status: "success", data });
});

export const updateHandler = asyncHandler(async (req: Request, res: Response) => {
  const id = parseId(req.params.id);
  const input = updateLedgerEntrySchema.parse(req.body);
  const data = await ledgerService.update(id, input);
  res.json({ status: "success", data });
});

export const deleteHandler = asyncHandler(async (req: Request, res: Response) => {
  const id = parseId(req.params.id);
  await ledgerService.remove(id);
  res.json({ status: "success", message: "Ledger entry deleted" });
});
