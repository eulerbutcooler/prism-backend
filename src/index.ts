import express, { NextFunction, Request, Response } from "express";
import { registrationMiddleware } from "./zod";
import { PrismaClient } from "@prisma/client";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import bcrypt from "bcrypt";
dotenv.config();
import cors from "cors";
import cookieParser from "cookie-parser";

const prisma = new PrismaClient();
const app = express();
app.use(express.json());
app.use(cors());
app.use(cookieParser());

// OR configure CORS options
app.use(
  cors({
    origin: "http://localhost:5173/", // Replace with your frontend URL
    methods: ["GET", "POST", "PUT", "DELETE"], // Allowed methods
    allowedHeaders: ["Content-Type", "Authorization"], // Allowed headers
    credentials: true, // Allow cookies if needed
  }),
);

const JWT_SECRET = process.env.JWT_SECRET!;

// 📌 Generate JWT Token
const generateToken = (email: string) => {
  return jwt.sign({ email }, JWT_SECRET, { expiresIn: "30d" });
};

// 📌 Hash Password
const hashPassword = async (password: string) => {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
};

// 📌 Compare Passwords
const comparePasswords = async (password: string, hash: string) => {
  return bcrypt.compare(password, hash);
};

// 📌 JWT Middleware
const authenticateJWT = (req: Request, res: Response, next: NextFunction) => {
  const token = req.cookies.token;

  if (!token) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }
  //@ts-ignore
  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) {
      res.status(403).json({ message: "Forbidden" });
      return;
    }

    (req as any).user = decoded; // Attach user info
    next();
  });
};

// 📌 Check if User Exists Middleware
const existingUser = async (
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

app.post("/events", async (req, res) => {
  try {
    const body = req.body;
    await prisma.events.create({
      data: {
        name: body.name,
        type: body.type,
      },
    });
    res.status(200).json("hogaya");
  } catch (err) {
    console.error(err);
    res.status(400).json("nahi hua");
  }
});

// 📌 Registration Route
app.post(
  "/registration/participant",
  existingUser,
  registrationMiddleware,
  async (req, res) => {
    try {
      const body = req.body;

      const hashedPassword = await hashPassword(body.password);

      await prisma.participant.create({
        data: {
          name: body.name,
          course: body.course,
          university: body.university,
          department: body.department,
          year: body.year,
          email: body.email,
          password: hashedPassword,
          contactNumber: body.contactNumber,
          gender: body.gender,
          type: body.type,
          members: {
            create: body.members,
          },
        },
      });

      const token = generateToken(body.email);
      res.cookie("token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 30 * 24 * 60 * 60 * 1000,
      });
      res.status(201).json({ message: "Registered successfully" });
    } catch (error) {
      console.error("Error creating team: ", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  },
);

// 📌 Event Registration

app.post("/events/:eventId/register", authenticateJWT, async (req, res) => {
  try {
    const eventId = parseInt(req.params.eventId);
    const userEmail = (req as any).user.email;

    const participant = await prisma.participant.findUnique({
      where: { email: userEmail },
      select: { id: true, type: true },
    });

    if (!participant) {
      res.status(404).json({ message: "Participant not found" });
      return;
    }

    const event = await prisma.events.findUnique({
      where: { id: eventId },
    });

    if (!event) {
      res.status(404).json({ message: "Event not found" });
      return;
    }

    if (participant.type !== event.type) {
      res.status(400).json({
        message: `Event requires ${event.type.toLowerCase()} participants`,
      });
      return;
    }

    const existingRegistration = await prisma.participantsOnEvents.findUnique({
      where: {
        participantId_eventId: {
          participantId: participant.id,
          eventId: eventId,
        },
      },
    });

    if (existingRegistration) {
      res.status(400).json({ message: "Already registered for this event" });
      return;
    }

    await prisma.participantsOnEvents.create({
      data: {
        participantId: participant.id,
        eventId: eventId,
      },
    });

    res.status(201).json({ message: "Successfully registered for event" });
  } catch (error) {
    console.error("Event registration error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// 📌 Login Route
app.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await prisma.participant.findUnique({
      where: { email },
      select: { password: true },
    });

    if (!user || !(await comparePasswords(password, user.password))) {
      res.status(401).json({ message: "Invalid credentials" });
      return;
    }

    const token = generateToken(email);
    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 30 * 24 * 60 * 60 * 1000,
    });
    res.json({ message: "Login successful", token });
  } catch (error) {
    console.error("Login error: ", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// 📌 Protected Route Example
app.get("/profile", authenticateJWT, async (req, res) => {
  const email = (req as any).user.email;

  const user = await prisma.participant.findUnique({
    where: { email },
    select: { id: true, email: true, name: true },
  });

  if (!user) {
    res.status(404).json({ message: "User not found" });
    return;
  }

  res.json(user);
});

// 📌 Start Server
app.listen(8888, () => {
  console.log("Server running on port 8888");
});
