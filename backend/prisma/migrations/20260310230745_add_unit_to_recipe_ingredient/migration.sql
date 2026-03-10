-- AlterTable: add unit column with default, then backfill from ingredient
ALTER TABLE "RecipeIngredient" ADD COLUMN "unit" "Unit" NOT NULL DEFAULT 'G';

-- Backfill existing rows: copy unit from their linked Ingredient
UPDATE "RecipeIngredient" ri
SET "unit" = i."unit"
FROM "Ingredient" i
WHERE ri."ingredientId" = i."id";

-- Remove the default so future inserts must provide a unit
ALTER TABLE "RecipeIngredient" ALTER COLUMN "unit" DROP DEFAULT;
