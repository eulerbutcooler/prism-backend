"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registrationMiddleware = exports.registrationSchema = void 0;
const zod_1 = require("zod");
exports.registrationSchema = zod_1.z.object({
    name: zod_1.z.string({ message: "Name is required" }),
    university: zod_1.z.string(),
    department: zod_1.z.enum(["cse", "ece", "it", "ee", "me", "ce"], {
        message: "Invalid department",
    }),
    year: zod_1.z.enum(["1st", "2nd", "3rd", "4th"], {
        message: "Invalid academic year",
    }),
    email: zod_1.z.string().email({ message: "Invalid email" }),
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
const soloParticipationSchema = exports.registrationSchema.extend({
    type: zod_1.z.literal("SOLO"),
});
const teamParticipationSchema = exports.registrationSchema.extend({
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
