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
exports.eventPopulate = exports.unregisterController = exports.registerController = void 0;
const db_1 = __importDefault(require("../lib/db"));
const registerController = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const eventId = parseInt(req.params.eventId);
        const userEmail = req.user.email;
        const participant = yield db_1.default.participant.findUnique({
            where: { email: userEmail },
            select: { id: true, type: true },
        });
        if (!participant) {
            res.status(404).json({ message: "Participant not found" });
            return;
        }
        const event = yield db_1.default.events.findUnique({
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
        const existingRegistration = yield db_1.default.participantsOnEvents.findUnique({
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
        yield db_1.default.participantsOnEvents.create({
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
});
exports.registerController = registerController;
const unregisterController = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userEmail = req.user.email;
        const participant = yield db_1.default.participant.findUnique({
            where: {
                email: userEmail,
            },
            select: {
                id: true,
                type: true,
            },
        });
        if (!participant) {
            res.status(400).json({ message: "Participant not found" });
            return;
        }
        const { eventId } = req.body;
        const eventUnregister = yield db_1.default.participantsOnEvents.delete({
            where: {
                participantId_eventId: {
                    participantId: participant.id,
                    eventId: eventId,
                },
            },
        });
    }
    catch (error) {
        console.error("Error unregistering participant from event:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});
exports.unregisterController = unregisterController;
const eventPopulate = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { name, type } = req.body;
        const event = db_1.default.events.create({
            data: {
                name: name,
                type: type,
            },
        });
        res.status(200).json("hogaya");
    }
    catch (error) {
        res.status(400).json("nahi hua");
    }
});
exports.eventPopulate = eventPopulate;
