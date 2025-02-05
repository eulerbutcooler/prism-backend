-- CreateEnum
CREATE TYPE "ParticipantType" AS ENUM ('SOLO', 'TEAM');

-- CreateTable
CREATE TABLE "Participant" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "university" TEXT NOT NULL,
    "course" TEXT NOT NULL,
    "department" TEXT NOT NULL,
    "year" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "contactNumber" TEXT NOT NULL,
    "gender" TEXT,
    "type" "ParticipantType" NOT NULL,

    CONSTRAINT "Participant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Member" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "participantId" INTEGER NOT NULL,

    CONSTRAINT "Member_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Events" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "type" "ParticipantType" NOT NULL,

    CONSTRAINT "Events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ParticipantsOnEvents" (
    "participantId" INTEGER NOT NULL,
    "eventId" INTEGER NOT NULL,

    CONSTRAINT "ParticipantsOnEvents_pkey" PRIMARY KEY ("participantId","eventId")
);

-- CreateIndex
CREATE UNIQUE INDEX "Participant_email_key" ON "Participant"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Participant_contactNumber_key" ON "Participant"("contactNumber");

-- CreateIndex
CREATE UNIQUE INDEX "Events_name_key" ON "Events"("name");

-- AddForeignKey
ALTER TABLE "Member" ADD CONSTRAINT "Member_participantId_fkey" FOREIGN KEY ("participantId") REFERENCES "Participant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ParticipantsOnEvents" ADD CONSTRAINT "ParticipantsOnEvents_participantId_fkey" FOREIGN KEY ("participantId") REFERENCES "Participant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ParticipantsOnEvents" ADD CONSTRAINT "ParticipantsOnEvents_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Events"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
