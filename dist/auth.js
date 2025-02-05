"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const authenticateJWT = (req, res, next) => {
    var _a;
    const token = (_a = req.header("Authorization")) === null || _a === void 0 ? void 0 : _a.split(" ")[1];
    if (!token) {
        return res.status(401).json({ message: "Unauthorized" });
    }
    //@ts-ignore
    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
        if (err) {
            return res.status(403).json({ message: "Forbidden" });
        }
        req.user = decoded;
        next();
    });
};
