import { Response, Request } from "express";
import prisma from "../lib/db";
import {
  generateToken,
  hashPassword,
  comparePasswords,
} from "../middleware/authMiddleware";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import nodemailer from "nodemailer";
import bcrypt from "bcrypt";
dotenv.config();

export const teamController = async (req: Request, res: Response) => {
  try {
    const body = req.body;
    const userEmail = (req as any).user.email;
    const participant = await prisma.participant.findUnique({
      where: {
        email: userEmail,
      },
    });
    if (!participant) {
      res.status(400).json({ message: "Participant not found" });
      return;
    }
    const addTeam = await prisma.participant.update({
      where: {
        email: userEmail,
      },
      data: {
        type: "MULTI",
        teamname: body.teamname,
        members: {
          create: body.members,
        },
      },
      select: {
        teamname: true,
        members: true,
      },
    });
    res.status(201).json({ message: "Added team", addTeam });
  } catch (error) {
    console.error("Error adding the team", error);
    res.status(401).json({ error: "Couldn't add the team" });
  }
};

export const updateController = async (req: Request, res: Response) => {
  try {
    const body = req.body;
    const userEmail = (req as any).user.email;

    const participant = await prisma.participant.findUnique({
      where: {
        email: userEmail,
      },
      select: {
        id: true,
      },
    });
    if (!participant) {
      res.status(400).json({ message: "Participant not found" });
      return;
    }

    const exisitingMembers = body.members
      .filter((m: any) => m.id)
      .map((m: any) => m.id);
    await prisma.member.deleteMany({
      where: {
        participantId: participant.id,
        id: { notIn: exisitingMembers },
      },
    });

    const updateMembers = body.members
      .filter((m: any) => m.id)
      .map((member: { id: number; name: string }) => ({
        where: {
          id: member.id,
          participantId: participant.id,
        },
        data: {
          name: member.name,
        },
      }));

    const createMembers = body.members
      .filter((m: any) => !m.id)
      .map((member: { name: string }) => ({
        name: member.name,
        participantId: participant.id,
      }));

    const updateParticipant = await prisma.participant.update({
      where: {
        email: userEmail,
        deletedAt: null,
      },
      data: {
        teamname: body.teamname,
        username: body.username,
        university: body.university,
        course: body.course,
        department: body.department,
        year: body.year,
        gender: body.gender,
        type: body.type,
        members: {
          updateMany: updateMembers,
          create: createMembers,
        },
      },
      select: {
        teamname: true,
        username: true,
        university: true,
        course: true,
        department: true,
        year: true,
        gender: true,
        type: true,
        members: true,
        email: true,
        contactNumber: true,
      },
    });
    res.status(201).json({ message: "Updated the user", updateParticipant });
  } catch (error) {
    console.error("Error updating the participant", error);
    res.status(401).json({ error: "Couldn't update the participant" });
  }
};

export const signupController = async (req: Request, res: Response) => {
  try {
    const body = req.body;

    const hashedPassword = await hashPassword(body.password);

    await prisma.participant.create({
      data: {
        username: body.name,
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
      secure: true,
      sameSite: "lax",
      maxAge: 30 * 24 * 60 * 60 * 1000,
      path: "/",
    });
    res.status(201).json({ message: "Registered successfully" });
  } catch (error) {
    console.error("Error creating team: ", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const deleteController = async (req: Request, res: Response) => {
  try {
    const userEmail = (req as any).user.email;
    await prisma.participant.update({
      where: {
        email: userEmail,
      },
      data: {
        deletedAt: new Date(),
      },
    });
  } catch (error) {}
};

export const loginController = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    const user = await prisma.participant.findUnique({
      where: { email, deletedAt: null },
      select: { password: true },
    });

    if (!user || !(await comparePasswords(password, user.password))) {
      res.status(401).json({ message: "Invalid credentials" });
      return;
    }

    const token = generateToken(email);
    res.cookie("token", token, {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      maxAge: 30 * 24 * 60 * 60 * 1000,
      path: "/",
    });
    res.json({ message: "Login successful", token });
  } catch (error) {
    console.error("Login error: ", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const requestPasswordReset = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    const user = await prisma.participant.findUnique({
      where: {
        email: email,
        deletedAt: null,
      },
      select: {
        id: true,
        email: true,
        password: true,
      },
    });

    if (!user) {
      res.status(400).json({ message: "Participant doesn't exist" });
      return;
    }
    const secret = process.env.JWT_SECRET + user.password;
    const token = jwt.sign({ id: user.id, email: user.email }, secret, {
      expiresIn: "1h",
    });
    const backend_url = process.env.BACKEND_URL;
    const resetUrl = `http://localhost:5173/passwordReset/${user.id}/${token}`;

    const transporter = nodemailer.createTransport({
      host: "smtp.titan.email",
      port: 465,
      secure: true,
      auth: {
        user: process.env.EMAIL,
        pass: process.env.EMAIL_PASSWORD,
      },
    });

    const mailOptions = {
      to: user.email,
      from: process.env.EMAIL,
      subject: "Password Reset Request",
      text: `You are receiving this because you have requested the reset of the password for your account. \n\n
      Please click on the following link to complete the process: \n\n
      ${resetUrl} \n\n
      If you did not request this, please ignore this email`,
    };
    await transporter.sendMail(mailOptions);
    res.status(200).json({ message: "Password reset link sent" });
    return;
  } catch (error) {
    res.status(500).json({ message: "Internal Server Error" });
    return;
  }
};

export const resetPassword = async (req: Request, res: Response) => {
  const { id, token } = req.params;
  const { password } = req.body;

  try {
    const user = await prisma.participant.findUnique({
      where: {
        id: parseInt(id),
        deletedAt: null,
      },
      select: {
        password: true,
      },
    });

    if (!user) {
      res.status(400).json({ message: "Participant not found" });
      return;
    }

    const secret = process.env.JWT_SECRET + user?.password;
    const verify = jwt.verify(token, secret);
    const encryptedPass = await bcrypt.hash(password, 10);

    await prisma.participant.update({
      where: {
        id: parseInt(id),
      },
      data: {
        password: encryptedPass,
      },
    });

    res.status(200).json({ message: "Password has been reset" });
    return;
  } catch (error) {
    res.status(500).json({ message: "Internal Server Error", error });
    return;
  }
};
