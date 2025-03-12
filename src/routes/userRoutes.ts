import express from "express";
import {
  signupController,
  loginController,
  requestPasswordReset,
  resetPassword,
  teamController,
  updateController,
  deleteController,
} from "../controller/userController";
import {
  registrationMiddleware,
  existingUser,
  loginMiddleware,
} from "../middleware/validationMiddleware";
import { authMiddleware } from "../middleware/authMiddleware";
const userRouter = express.Router();

userRouter.post(
  "/register",
  registrationMiddleware,
  existingUser,
  signupController,
);
userRouter.put("/addTeam", authMiddleware, teamController);
userRouter.post("/login", loginMiddleware, loginController);
userRouter.put("/update", authMiddleware, updateController);
userRouter.patch("/delete", authMiddleware, deleteController);
userRouter.post("/requestPasswordReset", requestPasswordReset);
userRouter.post("/resetPassword/:id/:token", resetPassword);
export default userRouter;
// add update user, delete user, get user
