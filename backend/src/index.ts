import { env } from "./common/env.js";
import express from "express";
import cors from "cors";
import path from "path";
import bcrypt from "bcryptjs";
import { globalErrorHandler } from "./common/errors.js";
import { prisma } from "./common/db.js";
import authRouter from "./auth/auth.router.js";
import ingredientsRouter from "./modules/ingredients/ingredients.router.js";
import recipesRouter from "./modules/recipes/recipes.router.js";
import calculatorRouter from "./modules/calculator/calculator.router.js";
import fixedCostsRouter from "./modules/fixed-costs/fixed-costs.router.js";

// Ensure types are loaded
import "./common/types.js";

async function seedAdminIfNeeded() {
  const userCount = await prisma.user.count();
  if (userCount === 0) {
    const hashedPassword = await bcrypt.hash("admin123", 10);
    await prisma.user.create({
      data: {
        email: "admin@maico.com",
        password: hashedPassword,
        name: "Admin",
        role: "ADMIN",
      },
    });
    console.log("Admin user seeded: admin@maico.com");
  }
}

const app = express();

app.use(cors());
app.use(express.json());
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

// Routes
app.use("/api/auth", authRouter);
app.use("/api/ingredients", ingredientsRouter);
app.use("/api/recipes", recipesRouter);
app.use("/api/calculator", calculatorRouter);
app.use("/api/fixed-costs", fixedCostsRouter);

// Health check
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok" });
});

// Global error handler
app.use(globalErrorHandler);

seedAdminIfNeeded()
  .then(() => {
    app.listen(env.PORT, () => {
      console.log(`Server running on port ${env.PORT}`);
    });
  })
  .catch((err) => {
    console.error("Failed to seed admin:", err);
    process.exit(1);
  });

export default app;
