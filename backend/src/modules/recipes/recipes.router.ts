import { Router } from "express";
import multer from "multer";
import { authenticate } from "../../auth/auth.middleware.js";
import {
  getAllHandler,
  getByIdHandler,
  createHandler,
  updateHandler,
  removeHandler,
} from "./recipes.controller.js";
import { uploadImageHandler } from "./recipes.upload.js";

const router = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

router.use(authenticate);

router.get("/", getAllHandler);
router.get("/:id", getByIdHandler);
router.post("/", createHandler);
router.post("/upload", upload.single("image"), uploadImageHandler);
router.put("/:id", updateHandler);
router.delete("/:id", removeHandler);

export default router;
