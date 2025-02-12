import express from "express";
import { authMiddleware } from "../middleware/authMiddleware";
import {
  registerController,
  eventPopulate,
  unregisterController,
} from "../controller/eventController";

const eventRouter = express.Router();

eventRouter.post("/:eventId/register", authMiddleware, registerController);
eventRouter.post("/populate", eventPopulate);
eventRouter.put("/unregister", authMiddleware, unregisterController);
export default eventRouter;
