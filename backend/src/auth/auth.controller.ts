import { Request, Response } from "express";
import { loginSchema, refreshSchema, createUserSchema } from "./auth.schema.js";
import * as authService from "./auth.service.js";
import { asyncHandler, parseId } from "../common/helpers.js";

export const loginHandler = asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = loginSchema.parse(req.body);
  const tokens = await authService.login(email, password);
  res.json({ status: "success", data: tokens });
});

export const refreshHandler = asyncHandler(async (req: Request, res: Response) => {
  const { refreshToken } = refreshSchema.parse(req.body);
  const result = await authService.refreshToken(refreshToken);
  res.json({ status: "success", data: result });
});

export const createUserHandler = asyncHandler(async (req: Request, res: Response) => {
  const data = createUserSchema.parse(req.body);
  const user = await authService.createUser(data);
  res.status(201).json({ status: "success", data: user });
});

export const getUsersHandler = asyncHandler(async (_req: Request, res: Response) => {
  const users = await authService.getUsers();
  res.json({ status: "success", data: users });
});

export const deleteUserHandler = asyncHandler(async (req: Request, res: Response) => {
  const id = parseId(req.params.id);
  await authService.deleteUser(id);
  res.json({ status: "success", message: "User deleted" });
});
