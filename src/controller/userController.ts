import { Response, Request } from "express";
import prisma from "../lib/db";
import {
  generateToken,
  hashPassword,
  comparePasswords,
} from "../middleware/authMiddleware";

export const signupController = async (req: Request, res: Response) => {
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
};

export const loginController = async (req: Request, res: Response) => {
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
};
