/*
  Warnings:

  - You are about to drop the column `participantId` on the `Member` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "Member" DROP CONSTRAINT "Member_participantId_fkey";

-- AlterTable
ALTER TABLE "Member" DROP COLUMN "participantId";
