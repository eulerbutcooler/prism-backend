import dotenv from "dotenv";
import jwt, { decode } from "jsonwebtoken";
import bcrypt from "bcrypt";
import { NextFunction, Request, Response } from "express";
dotenv.config();
const JWT_SECRET = process.env.JWT_SECRET || "default_key";

const generateToken = (email: string) => {
  return jwt.sign({ email }, JWT_SECRET, { expiresIn: "30d" });
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
  const token = req.cookies.token;

  if (!token) {
    res.status(401).json({ message: "Unauthorized" });
  }
  //@ts-ignore
  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) {
      res.status(403).json({ message: "Forbidden" });
      return;
    }
    (req as any).user = decoded;
    next();
  });
};

export { generateToken, hashPassword, comparePasswords, authMiddleware };
