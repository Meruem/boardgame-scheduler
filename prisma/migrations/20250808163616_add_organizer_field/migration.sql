/*
  Warnings:

  - Added the required column `organizer` to the `GameSession` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_GameSession" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "boardGameName" TEXT NOT NULL,
    "scheduledAt" DATETIME NOT NULL,
    "maxPlayers" INTEGER NOT NULL,
    "complexity" REAL NOT NULL DEFAULT 2.0,
    "minTimeMinutes" INTEGER NOT NULL DEFAULT 60,
    "maxTimeMinutes" INTEGER NOT NULL DEFAULT 60,
    "description" TEXT,
    "organizer" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_GameSession" ("boardGameName", "complexity", "createdAt", "description", "id", "maxPlayers", "maxTimeMinutes", "minTimeMinutes", "scheduledAt", "updatedAt", "organizer") SELECT "boardGameName", "complexity", "createdAt", "description", "id", "maxPlayers", "maxTimeMinutes", "minTimeMinutes", "scheduledAt", "updatedAt", 'Unknown Organizer' FROM "GameSession";
DROP TABLE "GameSession";
ALTER TABLE "new_GameSession" RENAME TO "GameSession";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
