import { prisma } from "../../common/db.js";
import { AppError } from "../../common/errors.js";
import { CreateFixedCostInput, UpdateFixedCostInput } from "./fixed-costs.schema.js";

export async function getAll() {
  return prisma.fixedCost.findMany({ orderBy: { name: "asc" } });
}

export async function create(data: CreateFixedCostInput) {
  return prisma.fixedCost.create({ data });
}

export async function update(id: number, data: UpdateFixedCostInput) {
  const existing = await prisma.fixedCost.findUnique({ where: { id } });
  if (!existing) throw new AppError("Fixed cost not found", 404);

  return prisma.fixedCost.update({ where: { id }, data });
}

export async function remove(id: number) {
  const existing = await prisma.fixedCost.findUnique({ where: { id } });
  if (!existing) throw new AppError("Fixed cost not found", 404);

  return prisma.fixedCost.delete({ where: { id } });
}
