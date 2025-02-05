import { z } from "zod";
import { Request, Response, NextFunction } from "express";
import { Result } from "@prisma/client/runtime/library";

export const registrationSchema = z.object({
  name: z.string({ message: "Name is required" }),
  university: z.string(),
  department: z.enum(["cse", "ece", "it", "ee", "me", "ce"], {
    message: "Invalid department",
  }),
  year: z.enum(["1st year", "2nd year", "3rd year", "4th year"], {
    message: "Invalid academic year",
  }),
  email: z.string().email({ message: "Invalid email" }),
  contactNumber: z.string().max(10, { message: "Invalid contact number" }),
  gender: z
    .enum(["male", "female", "other"], { message: "Invalid gender details" })
    .optional(),
  type: z.enum(["solo", "team"], { message: "Invalid" }),
});

const memberSchema = z.object({
  name: z.string().min(1, "Member name is required"),
});

const soloParticipationSchema = registrationSchema.extend({
  type: z.literal("SOLO"),
  members: z.never().optional(),
});

const teamParticipationSchema = registrationSchema.extend({
  type: z.literal("TEAM"),
  members: z.array(memberSchema).min(3, "Team must have 4 members only"),
});

const participantSchema = z.union([
  soloParticipationSchema,
  teamParticipationSchema,
]);

export const registrationMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const parsedBody = participantSchema.safeParse(req.body);
  if (!parsedBody.success) {
    res
      .status(400)
      .json({ error: "Invalid details", details: parsedBody.error.errors });
    return;
  }
  req.body = parsedBody.data;
  next();
};
