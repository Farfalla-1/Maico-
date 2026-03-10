import { Router } from "express";
import {
  loginHandler,
  refreshHandler,
  createUserHandler,
  getUsersHandler,
  deleteUserHandler,
} from "./auth.controller.js";
import { authenticate, authorize } from "./auth.middleware.js";

const router = Router();

router.post("/login", loginHandler);
router.post("/refresh", refreshHandler);

// Admin-only user management
router.get("/users", authenticate, authorize("ADMIN"), getUsersHandler);
router.post("/users", authenticate, authorize("ADMIN"), createUserHandler);
router.delete("/users/:id", authenticate, authorize("ADMIN"), deleteUserHandler);

export default router;
