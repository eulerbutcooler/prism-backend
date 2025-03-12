/*
  Warnings:

  - The values [TEAM] on the enum `ParticipantType` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "ParticipantType_new" AS ENUM ('SOLO', 'MULTI');
ALTER TABLE "Participant" ALTER COLUMN "type" TYPE "ParticipantType_new" USING ("type"::text::"ParticipantType_new");
ALTER TABLE "Events" ALTER COLUMN "type" TYPE "ParticipantType_new" USING ("type"::text::"ParticipantType_new");
ALTER TYPE "ParticipantType" RENAME TO "ParticipantType_old";
ALTER TYPE "ParticipantType_new" RENAME TO "ParticipantType";
DROP TYPE "ParticipantType_old";
COMMIT;

-- AlterTable
ALTER TABLE "Participant" ADD COLUMN     "deletedAt" TIMESTAMP(3);
