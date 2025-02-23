import express from "express";
import { authMiddleware } from "../middleware/authMiddleware";
import {
  registerController,
  // eventPopulate,
  unregisterController,
  registeredEvents,
} from "../controller/eventController";

const eventRouter = express.Router();

eventRouter.post("/:eventId/register", authMiddleware, registerController);
// eventRouter.post("/populate", eventPopulate);
eventRouter.delete("/unregister", authMiddleware, unregisterController);
eventRouter.get("/registered", authMiddleware, registeredEvents);
export default eventRouter;
