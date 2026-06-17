-- CreateTable
CREATE TABLE "MapVersion" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "eventId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "notes" TEXT,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "layout" TEXT NOT NULL,
    "activationReport" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "activatedAt" DATETIME,
    "archivedAt" DATETIME,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "MapVersion_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "MapVersion_eventId_status_idx" ON "MapVersion"("eventId", "status");
