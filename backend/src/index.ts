import { env } from "./common/env.js";
import express from "express";
import cors from "cors";
import path from "path";
import { globalErrorHandler } from "./common/errors.js";
import authRouter from "./auth/auth.router.js";
import ingredientsRouter from "./modules/ingredients/ingredients.router.js";
import recipesRouter from "./modules/recipes/recipes.router.js";
import calculatorRouter from "./modules/calculator/calculator.router.js";

// Ensure types are loaded
import "./common/types.js";

const app = express();

app.use(cors());
app.use(express.json());
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

// Routes
app.use("/api/auth", authRouter);
app.use("/api/ingredients", ingredientsRouter);
app.use("/api/recipes", recipesRouter);
app.use("/api/calculator", calculatorRouter);

// Health check
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok" });
});

// Global error handler
app.use(globalErrorHandler);

app.listen(env.PORT, () => {
  console.log(`Server running on port ${env.PORT}`);
});

export default app;
