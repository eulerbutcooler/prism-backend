/*
  Warnings:

  - You are about to drop the column `name` on the `Participant` table. All the data in the column will be lost.

*/
-- AlterEnum
ALTER TYPE "ParticipantType" ADD VALUE 'MULTI';

-- AlterTable
ALTER TABLE "Participant" DROP COLUMN "name",
ADD COLUMN     "teamname" TEXT,
ADD COLUMN     "username" TEXT;
