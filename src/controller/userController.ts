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
import { existingUser } from "../middleware/validationMiddleware";
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

export const teamExistsController = async (req: Request, res: Response) => {
  try {
    const userEmail = (req as any).user.email;
    const teamStatus = await prisma.participant.findUnique({
      where: {
        email: userEmail,
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

// export const updateController = async (req: Request, res: Response) => {
//   try {
//     const body = req.body;
//     const userEmail = (req as any).user.email;

//     const participant = await prisma.participant.findUnique({
//       where: {
//         email: userEmail,
//       },
//       select: {
//         id: true,
//         members: { select: { id: true, name: true } },
//       },
//     });
//     if (!participant) {
//       res.status(400).json({ message: "Participant not found" });
//       return;
//     }

//     if(body.members){

//       const newMembers = body.members.filter((m:any)=>!m.id).map((m:any)=>{name: m.name})

//       const existingMembers = body.members.filter((m: any)=>m.name).map((m:any)=>{
//         where: {
//           id:
//             },
//             data: {
//               name: m.name
//         }
//       })

//     const updateParticipant = await prisma.participant.update({
//       where: {
//         email: userEmail,
//         deletedAt: null,
//       },
//       data: {...body, members: {
//         create: newMembers,
//         update:
//       } },
//       select: {
//         teamname: true,
//         username: true,
//         university: true,
//         course: true,
//         department: true,
//         year: true,
//         gender: true,
//         type: true,
//         members: true,
//         email: true,
//         contactNumber: true,
//       },
//     });
//     res.status(201).json({ message: "Updated the user", updateParticipant });
//   } catch (error) {
//     console.error("Error updating the participant", error);
//     res.status(401).json({ error: "Couldn't update the participant" });
//   }
// };

export const userDetailsController = async (req: Request, res: Response) => {
  try {
    const userEmail = (req as any).user.email;
    const participant = await prisma.participant.findUnique({
      where: {
        email: userEmail,
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
