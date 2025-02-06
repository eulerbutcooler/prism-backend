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
const express_1 = __importDefault(require("express"));
const zod_1 = require("./zod");
const client_1 = require("@prisma/client");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const dotenv_1 = __importDefault(require("dotenv"));
const bcrypt_1 = __importDefault(require("bcrypt"));
dotenv_1.default.config();
const cors_1 = __importDefault(require("cors"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const prisma = new client_1.PrismaClient();
const app = (0, express_1.default)();
app.use(express_1.default.json());
app.use((0, cors_1.default)());
app.use((0, cookie_parser_1.default)());
// OR configure CORS options
app.use((0, cors_1.default)({
    origin: "http://localhost:5173/",
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true, // Allow cookies if needed
}));
const JWT_SECRET = process.env.JWT_SECRET;
// 📌 Generate JWT Token
const generateToken = (email) => {
    return jsonwebtoken_1.default.sign({ email }, JWT_SECRET, { expiresIn: "30d" });
};
// 📌 Hash Password
const hashPassword = (password) => __awaiter(void 0, void 0, void 0, function* () {
    const salt = yield bcrypt_1.default.genSalt(10);
    return bcrypt_1.default.hash(password, salt);
});
// 📌 Compare Passwords
const comparePasswords = (password, hash) => __awaiter(void 0, void 0, void 0, function* () {
    return bcrypt_1.default.compare(password, hash);
});
// 📌 JWT Middleware
const authenticateJWT = (req, res, next) => {
    const token = req.cookies.token;
    if (!token) {
        res.status(401).json({ message: "Unauthorized" });
        return;
    }
    //@ts-ignore
    jsonwebtoken_1.default.verify(token, JWT_SECRET, (err, decoded) => {
        if (err) {
            res.status(403).json({ message: "Forbidden" });
            return;
        }
        req.user = decoded; // Attach user info
        next();
    });
};
// 📌 Check if User Exists Middleware
const existingUser = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { email, contactNumber } = req.body;
        const user = yield prisma.participant.findFirst({
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
app.post("/events", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const body = req.body;
        yield prisma.events.create({
            data: {
                name: body.name,
                type: body.type,
            },
        });
        res.status(200).json("hogaya");
    }
    catch (err) {
        console.error(err);
        res.status(400).json("nahi hua");
    }
}));
// 📌 Registration Route
app.post("/registration/participant", existingUser, zod_1.registrationMiddleware, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const body = req.body;
        const hashedPassword = yield hashPassword(body.password);
        yield prisma.participant.create({
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
        const token = generateToken(body.email);
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
}));
// 📌 Event Registration
app.post("/events/:eventId/register", authenticateJWT, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const eventId = parseInt(req.params.eventId);
        const userEmail = req.user.email;
        const participant = yield prisma.participant.findUnique({
            where: { email: userEmail },
            select: { id: true, type: true },
        });
        if (!participant) {
            res.status(404).json({ message: "Participant not found" });
            return;
        }
        const event = yield prisma.events.findUnique({
            where: { id: eventId },
        });
        if (!event) {
            res.status(404).json({ message: "Event not found" });
            return;
        }
        if (participant.type !== event.type) {
            res.status(400).json({
                message: `Event requires ${event.type.toLowerCase()} participants`,
            });
            return;
        }
        const existingRegistration = yield prisma.participantsOnEvents.findUnique({
            where: {
                participantId_eventId: {
                    participantId: participant.id,
                    eventId: eventId,
                },
            },
        });
        if (existingRegistration) {
            res.status(400).json({ message: "Already registered for this event" });
            return;
        }
        yield prisma.participantsOnEvents.create({
            data: {
                participantId: participant.id,
                eventId: eventId,
            },
        });
        res.status(201).json({ message: "Successfully registered for event" });
    }
    catch (error) {
        console.error("Event registration error:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
}));
// 📌 Login Route
app.post("/login", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { email, password } = req.body;
        const user = yield prisma.participant.findUnique({
            where: { email },
            select: { password: true },
        });
        if (!user || !(yield comparePasswords(password, user.password))) {
            res.status(401).json({ message: "Invalid credentials" });
            return;
        }
        const token = generateToken(email);
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
}));
// 📌 Protected Route Example
app.get("/profile", authenticateJWT, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const email = req.user.email;
    const user = yield prisma.participant.findUnique({
        where: { email },
        select: { id: true, email: true, name: true },
    });
    if (!user) {
        res.status(404).json({ message: "User not found" });
        return;
    }
    res.json(user);
}));
// 📌 Start Server
app.listen(8888, () => {
    console.log("Server running on port 8888");
});
