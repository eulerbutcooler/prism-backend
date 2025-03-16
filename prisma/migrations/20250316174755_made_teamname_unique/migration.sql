/*
  Warnings:

  - A unique constraint covering the columns `[teamname]` on the table `Participant` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Participant_teamname_key" ON "Participant"("teamname");
