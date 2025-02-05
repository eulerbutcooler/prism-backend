import { Request, Response, NextFunction } from "express";

const authenticateJWT = (req: Request, res: Response, next: NextFunction) => {
  const token = req.header("Authorization")?.split(" ")[1];

  if (!token) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  //@ts-ignore
  jwt.verify(token, process.env.JWT_SECRET!, (err, decoded) => {
    if (err) {
      return res.status(403).json({ message: "Forbidden" });
    }
    (req as any).user = decoded;
    next();
  });
};
