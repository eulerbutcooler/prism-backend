import { z } from "zod";
import { Request, Response, NextFunction } from "express";
import prisma from "../lib/db";
import { parse } from "dotenv";

const loginSchema = z.object({
  email: z.string().email({ message: "Invalid email" }),
  password: z
    .string()
    .min(8, { message: "Password must be 8 characters long" })
    .max(12, { message: "Password can only be 12 characters long" }),
});

const registrationSchema = z.object({
  name: z.string({ message: "Name is required" }),
  course: z.string({ message: "Course is required" }),
  university: z.string(),
  department: z.enum(["cse", "ece", "it", "ee", "me", "ce"], {
    message: "Invalid department",
  }),
  year: z.enum(["1st", "2nd", "3rd", "4th"], {
    message: "Invalid academic year",
  }),
  email: z.string().email({ message: "Invalid email" }),
  password: z
    .string()
    .min(8, { message: "Password must be 8 characters long" })
    .max(12, { message: "Password can only be 12 characters long" }),
  contactNumber: z.string().max(10, { message: "Invalid contact number" }),
  gender: z
    .enum(["Male", "Female", "Other", ""], {
      message: "Invalid gender details",
    })
    .optional(),
  type: z.enum(["SOLO", "TEAM"], { message: "Invalid" }),
});

const memberSchema = z.object({
  name: z.string().min(1, "Member name is required"),
});

const soloParticipationSchema = registrationSchema.extend({
  type: z.literal("SOLO"),
});

const teamParticipationSchema = registrationSchema.extend({
  type: z.literal("TEAM"),
  members: z.array(memberSchema).min(4, "Team must have 4 members only"),
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

export const loginMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const parsedBody = loginSchema.safeParse(req.body);
  if (!parsedBody.success) {
    res
      .status(400)
      .json({ error: "Invalid details", details: parsedBody.error.errors });
    return;
  }
  req.body = parsedBody.data;
  next();
};

export const existingUser = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { email, contactNumber } = req.body;

    const user = await prisma.participant.findFirst({
      where: {
        OR: [{ email }, { contactNumber }],
      },
    });

    if (user) {
      res.status(400).json({ message: "User already exists" });
      return;
    }

    next();
  } catch (error) {
    console.error("Error checking user: ", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};
