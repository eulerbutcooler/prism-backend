"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const authMiddleware_1 = require("../middleware/authMiddleware");
const eventController_1 = require("../controller/eventController");
const eventRouter = express_1.default.Router();
eventRouter.post("/:eventId/register", authMiddleware_1.authMiddleware, eventController_1.registerController);
eventRouter.post("/populate", eventController_1.eventPopulate);
exports.default = eventRouter;
