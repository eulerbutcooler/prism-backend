import express, { NextFunction, Request, Response } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import userRoutes from "./routes/userRoutes";
import eventRoutes from "./routes/eventRoutes";
const app = express();
app.use(express.json());
app.use(cors());
app.use(cookieParser());

// app.use(
//   cors({
//     origin: "http://localhost:5173/",
//     methods: ["GET", "POST", "PUT", "DELETE"],
//     allowedHeaders: ["Content-Type", "Authorization"],
//     credentials: true,
//   }),
// );

app.use("/participant", userRoutes);
app.use("/event", eventRoutes);

app.get("/", (req, res) => {
  res.json({ message: "server is running on droplet woohoo" });
});

export default app;
