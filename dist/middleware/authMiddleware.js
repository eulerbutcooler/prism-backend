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
exports.authMiddleware = exports.comparePasswords = exports.hashPassword = exports.generateToken = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const bcrypt_1 = __importDefault(require("bcrypt"));
dotenv_1.default.config();
const JWT_SECRET = process.env.JWT_SECRET || "default_key";
const generateToken = (email) => {
    return jsonwebtoken_1.default.sign({ email }, JWT_SECRET, { expiresIn: "30d" });
};
exports.generateToken = generateToken;
const hashPassword = (password) => __awaiter(void 0, void 0, void 0, function* () {
    const salt = yield bcrypt_1.default.genSalt(10);
    return bcrypt_1.default.hash(password, salt);
});
exports.hashPassword = hashPassword;
const comparePasswords = (password, hash) => __awaiter(void 0, void 0, void 0, function* () {
    return bcrypt_1.default.compare(password, hash);
});
exports.comparePasswords = comparePasswords;
const authMiddleware = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const token = req.cookies.token;
    if (!token) {
        res.status(401).json({ message: "Unauthorized" });
    }
    //@ts-ignore
    jsonwebtoken_1.default.verify(token, JWT_SECRET, (err, decoded) => {
        if (err) {
            res.status(403).json({ message: "Forbidden" });
            return;
        }
        req.user = decoded;
        next();
    });
});
exports.authMiddleware = authMiddleware;
