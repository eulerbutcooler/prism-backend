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
      secure: false,
      sameSite: "none",
      maxAge: 30 * 24 * 60 * 60 * 1000,
      path: "/",
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
      secure: false,
      sameSite: "none",
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
