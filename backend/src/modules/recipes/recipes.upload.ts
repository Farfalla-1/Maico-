import { Request, Response } from "express";
import { asyncHandler } from "../../common/helpers.js";
import { v2 as cloudinary } from "cloudinary";
import { env } from "../../common/env.js";

cloudinary.config({
  cloud_name: env.CLOUDINARY_CLOUD_NAME,
  api_key: env.CLOUDINARY_API_KEY,
  api_secret: env.CLOUDINARY_API_SECRET,
});

export const uploadImageHandler = asyncHandler(async (req: Request, res: Response) => {
  if (!req.file) {
    res.status(400).json({ status: "error", message: "No file uploaded" });
    return;
  }

  const result = await new Promise<{ secure_url: string }>((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: "maico/recipes" },
      (error, result) => {
        if (error || !result) return reject(error);
        resolve(result);
      }
    );
    stream.end(req.file!.buffer);
  });

  res.json({ status: "success", data: { imageUrl: result.secure_url } });
});
