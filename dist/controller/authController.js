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
exports.loginController = exports.signupController = void 0;
const db_1 = __importDefault(require("../lib/db"));
const authMiddleware_1 = require("../middleware/authMiddleware");
const signupController = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const body = req.body;
        const hashedPassword = yield (0, authMiddleware_1.hashPassword)(body.password);
        yield db_1.default.participant.create({
            data: {
                name: body.name,
                course: body.course,
                university: body.university,
                department: body.department,
                year: body.year,
                email: body.email,
                password: hashedPassword,
                contactNumber: body.contactNumber,
                gender: body.gender,
                type: body.type,
                members: {
                    create: body.members,
                },
            },
        });
        const token = (0, authMiddleware_1.generateToken)(body.email);
        res.cookie("token", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict",
            maxAge: 30 * 24 * 60 * 60 * 1000,
        });
        res.status(201).json({ message: "Registered successfully" });
    }
    catch (error) {
        console.error("Error creating team: ", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});
exports.signupController = signupController;
const loginController = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { email, password } = req.body;
        const user = yield db_1.default.participant.findUnique({
            where: { email },
            select: { password: true },
        });
        if (!user || !(yield (0, authMiddleware_1.comparePasswords)(password, user.password))) {
            res.status(401).json({ message: "Invalid credentials" });
            return;
        }
        const token = (0, authMiddleware_1.generateToken)(email);
        res.cookie("token", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict",
            maxAge: 30 * 24 * 60 * 60 * 1000,
        });
        res.json({ message: "Login successful", token });
    }
    catch (error) {
        console.error("Login error: ", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});
exports.loginController = loginController;
