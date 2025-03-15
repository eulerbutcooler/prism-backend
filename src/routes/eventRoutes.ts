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
eventRouter.delete("/:eventId/unregister", authMiddleware, unregisterController); // this should have been patch/put method, we are not deleting any record from database, just updating the user's event field @aditya
eventRouter.get("/registered", authMiddleware, registeredEvents);
export default eventRouter;
