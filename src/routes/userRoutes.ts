import express from "express";
import {
  signupController,
  loginController,
  requestPasswordReset,
  resetPassword,
  // teamController,
  updateController,
  // deleteController,
  userDetailsController,
  // teamExistsController,
  // logoutController,
  teamRegister,
} from "../controller/userController";
import {
  registrationMiddleware,
  existingUser,
  loginMiddleware,
  updateMiddleware,
  // teamCreationMiddleware,
  teamRegisterMiddleware,
} from "../middleware/validationMiddleware";
import { authMiddleware } from "../middleware/authMiddleware";
const userRouter = express.Router();



// Done
userRouter.post(
  "/register",
  registrationMiddleware,
  existingUser,
  signupController
);
userRouter.post("/login", loginMiddleware, loginController);
// userRouter.post("/team", authMiddleware, teamRegisterMiddleware, teamRegister);
userRouter.get("/dashboard", authMiddleware, userDetailsController);
userRouter.put("/update", authMiddleware, updateMiddleware, updateController);
userRouter.post("/requestPasswordReset", requestPasswordReset);
userRouter.post("/resetPassword/:id/:token", resetPassword);
// userRouter.get("/teamStatus", authMiddleware, teamExistsController);




// Pending

// userRouter.put(
//   "/addTeam",
//   authMiddleware, // check auth before validating body @aditya
//   teamCreationMiddleware,
//   teamController
// );

// userRouter.post("/logout", logoutController);
// userRouter.patch("/delete", authMiddleware, deleteController); 
// // what is going on amaan, how can you delete on a patch method, REST API violation @aditya

export default userRouter;
// add update user, delete user, get user
