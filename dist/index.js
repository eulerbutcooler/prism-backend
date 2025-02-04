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
const prisma = new client_1.PrismaClient();
const app = (0, express_1.default)();
app.use(express_1.default.json());
//MIDDLEWARE
const existingUser = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const body = req.body;
        const existingUser = yield prisma.participant.findFirst({
            where: {
                OR: [{ email: body.email }, { contactNumber: body.contactNumber }],
            },
        });
        if (existingUser === null || existingUser === void 0 ? void 0 : existingUser.email) {
            res.status(400).json({ message: "User with this email already exists" });
            return;
        }
        if (existingUser === null || existingUser === void 0 ? void 0 : existingUser.contactNumber) {
            res
                .status(400)
                .json({ message: "User with this contact number already exists" });
            return;
        }
        next();
    }
    catch (error) {
        console.error("Error checking existing user: ", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
});
//ROUTES
app.post("/registration/solo", existingUser, zod_1.registrationMiddleware, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const body = req.body;
        yield prisma.participant.create({
            data: body,
        });
        res.status(201).json({ message: "User registered successfully" });
    }
    catch (error) {
        console.error("Error creating user: ", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
}));
app.post("/registration/team", existingUser, zod_1.registrationMiddleware, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const body = req.body;
        yield prisma.participant.create({
            data: {
                name: body.name,
                university: body.university,
                department: body.department,
                year: body.year,
                email: body.email,
                contactNumber: body.contactNumber,
                gender: body.gender,
                type: body.type,
                members: {
                    create: body.members,
                },
            },
        });
        res.status(201).json({ message: "Team registered successfully" });
    }
    catch (error) {
        console.error("Error creating team: ", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
}));
app.listen(8888);
