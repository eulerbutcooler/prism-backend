"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.existingUser = exports.loginMiddleware = exports.registrationMiddleware = void 0;
const zod_1 = require("zod");
const db_1 = __importDefault(require("../lib/db"));
const loginSchema = zod_1.z.object({
    email: zod_1.z.string().email({ message: "Invalid email" }),
    password: zod_1.z
        .string()
        .min(8, { message: "Password must be 8 characters long" })
        .max(12, { message: "Password can only be 12 characters long" }),
});
const registrationSchema = zod_1.z.object({
    name: zod_1.z.string({ message: "Name is required" }),
    course: zod_1.z.string({ message: "Course is required" }),
    university: zod_1.z.string(),
    department: zod_1.z.enum(["cse", "ece", "it", "ee", "me", "ce"], {
        message: "Invalid department",
    }),
    year: zod_1.z.enum(["1st", "2nd", "3rd", "4th"], {
        message: "Invalid academic year",
    }),
    email: zod_1.z.string().email({ message: "Invalid email" }),
    password: zod_1.z
        .string()
        .min(8, { message: "Password must be 8 characters long" })
        .max(12, { message: "Password can only be 12 characters long" }),
    contactNumber: zod_1.z.string().max(10, { message: "Invalid contact number" }),
    gender: zod_1.z
        .enum(["Male", "Female", "Other", ""], {
        message: "Invalid gender details",
    })
        .optional(),
    type: zod_1.z.enum(["SOLO", "TEAM"], { message: "Invalid" }),
});
const memberSchema = zod_1.z.object({
    name: zod_1.z.string().min(1, "Member name is required"),
});
const soloParticipationSchema = registrationSchema.extend({
    type: zod_1.z.literal("SOLO"),
});
const teamParticipationSchema = registrationSchema.extend({
    type: zod_1.z.literal("TEAM"),
    members: zod_1.z.array(memberSchema).min(4, "Team must have 4 members only"),
});
const participantSchema = zod_1.z.union([
    soloParticipationSchema,
    teamParticipationSchema,
]);
const registrationMiddleware = (req, res, next) => {
    const parsedBody = participantSchema.safeParse(req.body);
    if (!parsedBody.success) {
        res
            .status(400)
            .json({ error: "Invalid details", details: parsedBody.error.errors });
        return;
    }
    req.body = parsedBody.data;
    next();
};
exports.registrationMiddleware = registrationMiddleware;
const loginMiddleware = (req, res, next) => {
    const parsedBody = loginSchema.safeParse(req.body);
    if (!parsedBody.success) {
        res
            .status(400)
            .json({ error: "Invalid details", details: parsedBody.error.errors });
        return;
    }
    req.body = parsedBody.data;
    next();
};
exports.loginMiddleware = loginMiddleware;
const existingUser = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { email, contactNumber } = req.body;
        const user = yield db_1.default.participant.findFirst({
            where: {
                OR: [{ email }, { contactNumber }],
            },
        });
        if (user) {
            res.status(400).json({ message: "User already exists" });
            return;
        }
        next();
    }
    catch (error) {
        console.error("Error checking user: ", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
});
exports.existingUser = existingUser;
