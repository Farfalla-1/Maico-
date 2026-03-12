import { Router } from "express";
import { authenticate } from "../../auth/auth.middleware.js";
import { authorize } from "../../auth/auth.middleware.js";
import {
  getAllHandler,
  getSummaryHandler,
  createHandler,
  updateHandler,
  deleteHandler,
} from "./ledger.controller.js";

const router = Router();

router.use(authenticate);
router.use(authorize("ADMIN"));

router.get("/", getAllHandler);
router.get("/summary", getSummaryHandler);
router.post("/", createHandler);
router.put("/:id", updateHandler);
router.delete("/:id", deleteHandler);

export default router;
