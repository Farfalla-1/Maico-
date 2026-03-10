import { Request, Response } from "express";
import { asyncHandler } from "../../common/helpers.js";
import path from "path";
import fs from "fs/promises";

const UPLOAD_DIR = path.join(process.cwd(), "uploads", "recipes");

async function ensureUploadDir() {
  await fs.mkdir(UPLOAD_DIR, { recursive: true });
}

export const uploadImageHandler = asyncHandler(async (req: Request, res: Response) => {
  await ensureUploadDir();

  if (!req.file) {
    res.status(400).json({ status: "error", message: "No file uploaded" });
    return;
  }

  const filename = `${Date.now()}-${req.file.originalname}`;
  const filepath = path.join(UPLOAD_DIR, filename);
  await fs.writeFile(filepath, req.file.buffer);

  const imageUrl = `/uploads/recipes/${filename}`;
  res.json({ status: "success", data: { imageUrl } });
});
