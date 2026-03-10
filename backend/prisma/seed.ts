import { PrismaClient, Unit, Role } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const hashedPassword = await bcrypt.hash("admin123", 10);

  const admin = await prisma.user.upsert({
    where: { email: "admin@maico.com" },
    update: {},
    create: {
      email: "admin@maico.com",
      password: hashedPassword,
      name: "Admin",
      role: Role.ADMIN,
    },
  });

  console.log("Admin user created:", admin.email);

  const ingredients = [
    { name: "Harina", unit: Unit.KG, price: 500 },
    { name: "Azúcar", unit: Unit.KG, price: 600 },
    { name: "Manteca", unit: Unit.KG, price: 1200 },
    { name: "Huevos", unit: Unit.UNIT, price: 80 },
    { name: "Leche", unit: Unit.L, price: 400 },
  ];

  for (const ingredient of ingredients) {
    const created = await prisma.ingredient.upsert({
      where: { id: ingredients.indexOf(ingredient) + 1 },
      update: {},
      create: {
        name: ingredient.name,
        unit: ingredient.unit,
        price: ingredient.price,
      },
    });
    console.log("Ingredient created:", created.name);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
