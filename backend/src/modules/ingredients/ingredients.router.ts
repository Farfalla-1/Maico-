import { Router } from "express";
import { authenticate } from "../../auth/auth.middleware.js";
import {
  getAllHandler,
  getByIdHandler,
  createHandler,
  updateHandler,
  removeHandler,
} from "./ingredients.controller.js";

const router = Router();

router.use(authenticate);

router.get("/", getAllHandler);
router.get("/:id", getByIdHandler);
router.post("/", createHandler);
router.put("/:id", updateHandler);
router.delete("/:id", removeHandler);

export default router;
