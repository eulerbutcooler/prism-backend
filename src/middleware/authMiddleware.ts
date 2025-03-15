import dotenv from "dotenv";
import jwt, { decode } from "jsonwebtoken";
import bcrypt from "bcrypt";
import { NextFunction, Request, Response } from "express";
dotenv.config();
const JWT_SECRET = process.env.JWT_SECRET || "default_key";

const generateToken = (id: number) => {
  return jwt.sign({ id }, JWT_SECRET, { expiresIn: "30d" });
};

const hashPassword = async (password: string) => {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
};

const comparePasswords = async (password: string, hash: string) => {
  return bcrypt.compare(password, hash);
};

const authMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const token = req.cookies.token;
    console.log("cookie hai kya", req.cookies);
    console.log("headers hai ye", req.headers);
    console.log("env mein ye hai", JWT_SECRET);
    // const token = req.headers.authorization?.split(" ")[1];
    console.log("token is this: ", token);
    if (!token) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    (req as any).user = decoded;
    next();
  } catch (err) {
    console.log("error ye hai dekho", err);
    res.status(403).json({ message: "Forbidden" });
    return;
  }
};

export { generateToken, hashPassword, comparePasswords, authMiddleware };
