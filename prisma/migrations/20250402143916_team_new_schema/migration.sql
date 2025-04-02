/*
  Warnings:

  - Added the required column `teamId` to the `Member` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Member" ADD COLUMN     "teamId" INTEGER NOT NULL;

-- CreateTable
CREATE TABLE "Team" (
    "id" SERIAL NOT NULL,
    "teamname" TEXT NOT NULL,
    "participantId" INTEGER NOT NULL,

    CONSTRAINT "Team_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Team" ADD CONSTRAINT "Team_participantId_fkey" FOREIGN KEY ("participantId") REFERENCES "Participant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Member" ADD CONSTRAINT "Member_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
