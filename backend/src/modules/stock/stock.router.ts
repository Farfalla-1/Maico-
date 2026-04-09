import { Router } from "express";
import { authenticate, authorize } from "../../auth/auth.middleware.js";
import {
  getAllHandler,
  getByIdHandler,
  createHandler,
  updateHandler,
  deleteHandler,
  addMovementHandler,
  getMovementsHandler,
} from "./stock.controller.js";

const router = Router();

router.use(authenticate);

router.get("/", getAllHandler);
router.get("/:id", getByIdHandler);
router.get("/:id/movements", getMovementsHandler);

router.use(authorize("ADMIN"));

router.post("/", createHandler);
router.put("/:id", updateHandler);
router.delete("/:id", deleteHandler);
router.post("/:id/movements", addMovementHandler);

export default router;
