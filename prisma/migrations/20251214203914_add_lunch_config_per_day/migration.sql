-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_schools" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "phone" TEXT,
    "email" TEXT,
    "scheduleStartTime" TEXT NOT NULL DEFAULT '09:00',
    "scheduleEndTime" TEXT NOT NULL DEFAULT '18:00',
    "blockDuration" INTEGER NOT NULL DEFAULT 60,
    "breakDuration" INTEGER NOT NULL DEFAULT 15,
    "lunchBreakEnabled" BOOLEAN NOT NULL DEFAULT true,
    "lunchBreakConfig" TEXT NOT NULL DEFAULT '{"MONDAY":{"enabled":true,"start":"13:00","end":"14:00"},"TUESDAY":{"enabled":true,"start":"13:00","end":"14:00"},"WEDNESDAY":{"enabled":true,"start":"13:00","end":"14:00"},"THURSDAY":{"enabled":true,"start":"13:00","end":"14:00"},"FRIDAY":{"enabled":true,"start":"13:00","end":"14:00"}}',
    "lunchBreakStart" TEXT NOT NULL DEFAULT '13:00',
    "lunchBreakEnd" TEXT NOT NULL DEFAULT '14:00',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_schools" ("address", "blockDuration", "breakDuration", "createdAt", "email", "id", "lunchBreakEnabled", "lunchBreakEnd", "lunchBreakStart", "name", "phone", "scheduleEndTime", "scheduleStartTime", "updatedAt") SELECT "address", "blockDuration", "breakDuration", "createdAt", "email", "id", "lunchBreakEnabled", "lunchBreakEnd", "lunchBreakStart", "name", "phone", "scheduleEndTime", "scheduleStartTime", "updatedAt" FROM "schools";
DROP TABLE "schools";
ALTER TABLE "new_schools" RENAME TO "schools";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
