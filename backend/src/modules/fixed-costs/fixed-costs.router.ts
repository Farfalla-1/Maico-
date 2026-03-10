import { Router } from "express";
import { authenticate } from "../../auth/auth.middleware.js";
import {
  getAllHandler,
  createHandler,
  updateHandler,
  deleteHandler,
} from "./fixed-costs.controller.js";

const router = Router();

router.use(authenticate);

router.get("/", getAllHandler);
router.post("/", createHandler);
router.put("/:id", updateHandler);
router.delete("/:id", deleteHandler);

export default router;
