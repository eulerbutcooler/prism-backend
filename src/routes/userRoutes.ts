import express from "express";
import {
  signupController,
  loginController,
  requestPasswordReset,
  resetPassword,
} from "../controller/userController";
import {
  registrationMiddleware,
  existingUser,
  loginMiddleware,
} from "../middleware/validationMiddleware";
const userRouter = express.Router();

userRouter.post(
  "/register",
  registrationMiddleware,
  existingUser,
  signupController,
);

userRouter.post("/login", loginMiddleware, existingUser, loginController);

userRouter.post("/requestPasswordReset", requestPasswordReset);
userRouter.post("/resetPassword/:id/:token", resetPassword);
export default userRouter;
