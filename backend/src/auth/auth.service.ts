import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { prisma } from "../common/db.js";
import { env } from "../common/env.js";
import { AppError } from "../common/errors.js";
import { AuthPayload } from "../common/types.js";

function signAccessToken(payload: AuthPayload): string {
  return jwt.sign(payload, env.JWT_SECRET, { expiresIn: "1h" });
}

function signRefreshToken(payload: AuthPayload): string {
  return jwt.sign(payload, env.JWT_REFRESH_SECRET, { expiresIn: "7d" });
}

export async function login(
  email: string,
  password: string
): Promise<{ accessToken: string; refreshToken: string }> {
  const user = await prisma.user.findUnique({ where: { email } });

  if (!user) {
    throw new AppError("Invalid credentials", 401);
  }

  const isPasswordValid = await bcrypt.compare(password, user.password);

  if (!isPasswordValid) {
    throw new AppError("Invalid credentials", 401);
  }

  const payload: AuthPayload = { userId: user.id, role: user.role };

  return {
    accessToken: signAccessToken(payload),
    refreshToken: signRefreshToken(payload),
  };
}

export async function createUser(data: {
  email: string;
  password: string;
  name: string;
  role: "ADMIN" | "EMPLOYEE";
}) {
  const existing = await prisma.user.findUnique({ where: { email: data.email } });
  if (existing) {
    throw new AppError("Email already in use", 409);
  }

  const hashedPassword = await bcrypt.hash(data.password, 10);
  const user = await prisma.user.create({
    data: {
      email: data.email,
      password: hashedPassword,
      name: data.name,
      role: data.role,
    },
    select: { id: true, email: true, name: true, role: true, createdAt: true },
  });

  return user;
}

export async function getUsers() {
  return prisma.user.findMany({
    select: { id: true, email: true, name: true, role: true, createdAt: true },
    orderBy: { createdAt: "desc" },
  });
}

export async function deleteUser(id: number) {
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) {
    throw new AppError("User not found", 404);
  }
  await prisma.user.delete({ where: { id } });
}

export async function refreshToken(
  token: string
): Promise<{ accessToken: string }> {
  try {
    const decoded = jwt.verify(token, env.JWT_REFRESH_SECRET) as AuthPayload;

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
    });

    if (!user) {
      throw new AppError("User not found", 401);
    }

    const payload: AuthPayload = { userId: user.id, role: user.role };

    return {
      accessToken: signAccessToken(payload),
    };
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError("Invalid or expired refresh token", 401);
  }
}
