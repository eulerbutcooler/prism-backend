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
    const userId = (req as any).user.id;
    const participant = await prisma.participant.findUnique({
      where: {
        id: userId,
      },
    });
    if (!participant) {
      res.status(400).json({ message: "Participant not found" });
      return;
    }
    const addTeam = await prisma.participant.update({
      where: {
        id: userId,
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

export const teamExistsController = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const teamStatus = await prisma.participant.findUnique({
      where: {
        id: userId,
      },
      select: {
        teamname: true,
        members: true,
      },
    });

    res.status(200).json({ message: "Team details: ", teamStatus });
  } catch (error) {
    console.error("Team Couldn't be found", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const updateController = async (req: Request, res: Response) => {
  try {
    const body = req.body;
    const userId = (req as any).user.id;
    console.log(userId);
    const participant = await prisma.participant.findUnique({
      where: {
        id: userId,
      },
      select: {
        id: true,
      },
    });
    if (!participant) {
      res.status(400).json({ message: "Participant not found" });
      return;
    }

    delete body?.password;
    delete body?.id;
    delete body?.deletedAt;
    delete body?.email;
    delete body?.contactNumber;

    if (body.members) {
      const existingMembers = await prisma.member.findMany({
        where: {
          participantId: participant.id,
        },
        select: {
          name: true,
        },
      });

      const existingNames = new Set(existingMembers.map((m: any) => m.name));
      const newNames = new Set(body.members.map((m: any) => m.name));

      await prisma.member.deleteMany({
        where: {
          participantId: participant.id,
          name: { notIn: Array.from(newNames) as string[] },
        },
      });

      const updateMembers = body.members
        .filter((m: any) => existingNames.has(m.name))
        .map((m: any) =>
          prisma.member.updateMany({
            where: {
              participantId: participant.id,
              name: m.name,
            },
            data: {
              name: m.name,
            },
          }),
        );

      const createMembers = body.members
        .filter((m: any) => !existingNames.has(m.name))
        .map((m: any) =>
          prisma.member.create({
            data: {
              name: m.name,
              participantId: participant.id,
            },
          }),
        );

      Promise.all([...createMembers, ...updateMembers]);
      delete body.members;
    }

    const updateParticipant = await prisma.participant.update({
      where: {
        id: userId,
        deletedAt: null,
      },
      data: { ...body },
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
    res.status(200).json({ message: "Updated the user", updateParticipant }); // 200 not 201 nothing being created @aditya
  } catch (error) {
    console.error("Error updating the participant", error);
    res.status(500).json({ error: "Couldn't update the participant" }); // 500 not 401, ISE not Unauthorized @aditya
  }
};

export const userDetailsController = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const participant = await prisma.participant.findUnique({
      where: {
        id: userId,
      },
      select: {
        teamname: true,
        members: true,
        username: true,
        university: true,
        course: true,
        department: true,
        year: true,
        email: true,
        contactNumber: true,
        gender: true,
        events: true,
      },
    });
    if (!participant) {
      res.json({ message: "Participant not found" });
      return;
    }
    res.status(200).json({ message: "User details are: ", participant });
  } catch (error) {
    console.error("Internal server error", error);
    res.status(500).json({ message: "Server Error" });
  }
};
export const signupController = async (req: Request, res: Response) => {
  try {
    const body = req.body;

    const hashedPassword = await hashPassword(body.password);

    await prisma.participant.create({
      data: {
        username: body.username, // body.username not body.name @aditya
        course: body.course,
        university: body.university,
        department: body.department,
        year: body.year,
        email: body.email,
        password: hashedPassword,
        contactNumber: body.contactNumber,
        gender: body.gender,
        type: body.type,
        deletedAt: null,
        members: {
          create: body.members,
        },
      },
    });

    const participant = await prisma.participant.findUnique({
      where: {
        email: body.email,
      },
      select: {
        id: true,
      },
    });

    if (!participant) {
      res.status(404).json({ message: "Participant not found" });
      return;
    }

    const token = generateToken(participant.id);
    res.cookie("token", token, {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      maxAge: 30 * 24 * 60 * 60 * 1000,
      path: "/",
    });
    console.log("token in signup - ", token);
    res.status(201).json({ message: "Registered successfully" });
  } catch (error) {
    console.error("Error creating team: ", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const deleteController = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    await prisma.participant.update({
      where: {
        id: userId,
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
      select: { password: true, id: true },
    });

    if (!user || !(await comparePasswords(password, user.password))) {
      res.status(401).json({ message: "Invalid credentials" });
      return;
    }

    const token = generateToken(user.id);
    res.cookie("token", token, {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      maxAge: 30 * 24 * 60 * 60 * 1000,
      path: "/",
    });
    console.log("token in login - ", token);
    res.json({ message: "Login successful", token });
  } catch (error) {
    console.error("Login error: ", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const logoutController = async (req: Request, res: Response) => {
  try {
    res.clearCookie("token", { path: "/", httpOnly: true, secure: false });
    res.status(200).json({ message: "Logout successful" });
    return;
  } catch (error) {
    res.status(500).json({ message: "Error logging out", error });
    return;
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
