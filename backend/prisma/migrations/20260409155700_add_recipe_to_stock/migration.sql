/*
  Warnings:

  - A unique constraint covering the columns `[type,recipeId]` on the table `StockItem` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "StockItem" ADD COLUMN     "recipeId" INTEGER;

-- CreateIndex
CREATE UNIQUE INDEX "StockItem_type_recipeId_key" ON "StockItem"("type", "recipeId");

-- AddForeignKey
ALTER TABLE "StockItem" ADD CONSTRAINT "StockItem_recipeId_fkey" FOREIGN KEY ("recipeId") REFERENCES "Recipe"("id") ON DELETE CASCADE ON UPDATE CASCADE;
