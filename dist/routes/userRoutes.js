"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const userController_1 = require("../controller/userController");
const validationMiddleware_1 = require("../middleware/validationMiddleware");
const userRouter = express_1.default.Router();
userRouter.post("/register", validationMiddleware_1.registrationMiddleware, validationMiddleware_1.existingUser, userController_1.signupController);
userRouter.post("/login", validationMiddleware_1.loginMiddleware, validationMiddleware_1.existingUser, userController_1.loginController);
exports.default = userRouter;
