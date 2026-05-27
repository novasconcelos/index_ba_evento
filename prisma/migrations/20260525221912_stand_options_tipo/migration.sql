-- AlterTable
ALTER TABLE "Stand" ADD COLUMN "tipo" TEXT;

-- CreateTable
CREATE TABLE "StandOption" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "kind" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "StandOption_kind_value_key" ON "StandOption"("kind", "value");
