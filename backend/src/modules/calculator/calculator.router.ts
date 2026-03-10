import { Router } from "express";
import { authenticate } from "../../auth/auth.middleware.js";
import { calculateHandler } from "./calculator.controller.js";

const router = Router();

router.use(authenticate);

router.post("/calculate", calculateHandler);

export default router;
