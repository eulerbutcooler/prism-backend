import express from "express";
import {
  signupController,
  loginController,
  requestPasswordReset,
  resetPassword,
  teamController,
  updateController,
  deleteController,
  userDetailsController,
  teamExistsController,
} from "../controller/userController";
import {
  registrationMiddleware,
  existingUser,
  loginMiddleware,
  updateMiddleware,
  teamCreationMiddleware,
} from "../middleware/validationMiddleware";
import { authMiddleware } from "../middleware/authMiddleware";
const userRouter = express.Router();

userRouter.post(
  "/register",
  registrationMiddleware,
  existingUser,
  signupController,
);
userRouter.get("/teamStatus", authMiddleware, teamExistsController);
userRouter.get("/dashboard", authMiddleware, userDetailsController);
userRouter.put(
  "/addTeam",
  authMiddleware, // check auth before validating body @aditya
  teamCreationMiddleware,
  teamController,
);
userRouter.post("/login", loginMiddleware, loginController);
userRouter.put("/update", updateMiddleware, authMiddleware, updateController);
// userRouter.patch("/delete", authMiddleware, deleteController); // what is going on amaan, how can you delete on a patch method, REST API violation @aditya
userRouter.post("/requestPasswordReset", requestPasswordReset);
userRouter.post("/resetPassword/:id/:token", resetPassword);
export default userRouter;
// add update user, delete user, get user
