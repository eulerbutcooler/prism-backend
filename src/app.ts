import express, { NextFunction, Request, Response } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import userRoutes from "./routes/userRoutes";
import eventRoutes from "./routes/eventRoutes";
const app = express();
app.use(express.json());
app.use(cookieParser());

const allowedOrigins = [
  "https://www.prism2025.tech",
  "https://prism2025.tech",
  "http://localhost:5173",
  "http://localhost:4173",
];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  }),
);

app.use("/participant", userRoutes);
app.use("/event", eventRoutes);

app.get("/", (req, res) => {
  res.json({ message: "server is running on droplet woohoo" });
});

export default app;
