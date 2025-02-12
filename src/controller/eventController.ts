import { Response, Request } from "express";
import prisma from "../lib/db";

export const registerController = async (req: Request, res: Response) => {
  try {
    const eventId = parseInt(req.params.eventId);
    const userEmail = (req as any).user.email;

    const participant = await prisma.participant.findUnique({
      where: { email: userEmail },
      select: { id: true, type: true },
    });

    if (!participant) {
      res.status(404).json({ message: "Participant not found" });
      return;
    }

    const event = await prisma.events.findUnique({
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

    const existingRegistration = await prisma.participantsOnEvents.findUnique({
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

    await prisma.participantsOnEvents.create({
      data: {
        participantId: participant.id,
        eventId: eventId,
      },
    });

    res.status(201).json({ message: "Successfully registered for event" });
  } catch (error) {
    console.error("Event registration error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const unregisterController = async (req: Request, res: Response) => {
  try {
    const userEmail = (req as any).user.email;

    const participant = await prisma.participant.findUnique({
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
    const eventUnregister = await prisma.participantsOnEvents.delete({
      where: {
        participantId_eventId: {
          participantId: participant.id,
          eventId: eventId,
        },
      },
    });
  } catch (error) {
    console.error("Error unregistering participant from event:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const eventPopulate = async (req: Request, res: Response) => {
  try {
    const { name, type } = req.body;
    const event = prisma.events.create({
      data: {
        name: name,
        type: type,
      },
    });
    res.status(200).json("hogaya");
  } catch (error) {
    res.status(400).json("nahi hua");
  }
};
