import express, { NextFunction, Request, Response } from "express";
import { registrationMiddleware } from "./zod";
import { PrismaClient } from "@prisma/client";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import bcrypt from "bcrypt";
dotenv.config();

const prisma = new PrismaClient();
const app = express();
app.use(express.json());

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
  const token = req.header("Authorization")?.split(" ")[1];

  if (!token) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }

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

// 📌 Registration Route
app.post(
  "/registration/team",
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
      res.status(201).json({ message: "Team registered successfully", token });
    } catch (error) {
      console.error("Error creating team: ", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  },
);

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
