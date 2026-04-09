-- CreateTable
CREATE TABLE "LedgerSaleItem" (
    "id" SERIAL NOT NULL,
    "ledgerEntryId" INTEGER NOT NULL,
    "stockItemId" INTEGER NOT NULL,
    "quantity" DECIMAL(65,30) NOT NULL,
    "deductStock" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "LedgerSaleItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LedgerExtraCharge" (
    "id" SERIAL NOT NULL,
    "ledgerEntryId" INTEGER NOT NULL,
    "description" TEXT NOT NULL,
    "amount" DECIMAL(65,30) NOT NULL,

    CONSTRAINT "LedgerExtraCharge_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "LedgerSaleItem" ADD CONSTRAINT "LedgerSaleItem_ledgerEntryId_fkey" FOREIGN KEY ("ledgerEntryId") REFERENCES "LedgerEntry"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LedgerSaleItem" ADD CONSTRAINT "LedgerSaleItem_stockItemId_fkey" FOREIGN KEY ("stockItemId") REFERENCES "StockItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LedgerExtraCharge" ADD CONSTRAINT "LedgerExtraCharge_ledgerEntryId_fkey" FOREIGN KEY ("ledgerEntryId") REFERENCES "LedgerEntry"("id") ON DELETE CASCADE ON UPDATE CASCADE;
