/*
  Warnings:

  - You are about to drop the column `teamname` on the `Participant` table. All the data in the column will be lost.
  - You are about to drop the column `type` on the `Participant` table. All the data in the column will be lost.
  - Made the column `username` on table `Participant` required. This step will fail if there are existing NULL values in that column.
  - Added the required column `eventId` to the `Team` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "Participant_teamname_key";

-- AlterTable
ALTER TABLE "Participant" DROP COLUMN "teamname",
DROP COLUMN "type",
ALTER COLUMN "username" SET NOT NULL;

-- AlterTable
ALTER TABLE "Team" ADD COLUMN     "eventId" INTEGER NOT NULL;

-- AddForeignKey
ALTER TABLE "Team" ADD CONSTRAINT "Team_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Events"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
