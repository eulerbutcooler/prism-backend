import { Response, Request } from "express";
import prisma from "../lib/db";

export const registerController = async (req: Request, res: Response) => {
  try {
    const eventId = parseInt(req.params.eventId);
    const userId = (req as any).user.id;

    // Check participant
    const participant = await prisma.participant.findUnique({
      where: { id: userId },
      select: { id: true },
    });
    if (!participant) {
      res.status(404).json({ message: "Participant not found" });
      return;
    }

    // Check event
    const event = await prisma.events.findUnique({
      where: { id: eventId },
    });
    if (!event) {
      res.status(404).json({ message: "Event not found" });
      return;
    }

    // Ensure participant has not already registered for event
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

    // Check if event type is solo
    if (event.type !== "SOLO") {
      res.status(400).json({
        message: "Event required team participation",
      });
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

export const registerTeamEventController = async (
  req: Request,
  res: Response
) => {
  try {
    const {
      user: { id: userId },
      body,
      params: { eventId },
    } = req as any;

    // Check participant
    const participant = await prisma.participant.findUnique({
      where: { id: userId },
      select: { id: true },
    });
    if (!participant) {
      res.status(404).json({ message: "Participant not found" });
      return;
    }

    // Check event
    const event = await prisma.events.findUnique({
      where: { id: parseInt(eventId) },
    });
    if (!event) {
      res.status(404).json({ message: "Event not found" });
      return;
    }

    // Check user has not already registered team for this event
    const alreadyRegistered = await prisma.team.findFirst({
      where: {
        participantId: userId,
        eventId: parseInt(eventId),
      },
    });
    if (alreadyRegistered) {
      res.status(402).json({ message: "Already registered for this event" });
      return;
    }

    const team = await prisma.team.create({
      data: {
        teamname: body.teamname,
        members: {
          createMany: {
            data: body.members.map(
              (member: { name: string; email: string }) => ({
                name: member.name,
              })
            ),
          },
        },
        eventId: parseInt(eventId),
        participantId: userId,
      },
    });

    res
      .status(201)
      .json({ message: "Team registered for event successfully", team });
  } catch (error) {
    console.error("Event registration error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const unregisterController = async (req: Request, res: Response) => {
  try {
    const {
      user: { id: userId },
      params: { eventId },
    } = req as any;
    const eventIdNumber = parseInt(eventId);

    // Find participant
    const participant = await prisma.participant.findUnique({
      where: {
        id: userId,
      },
      select: {
        id: true,
      },
    });
    if (!participant) {
      res.status(400).json({ message: "Participant not found" });
      return;
    }

    // Find event
    const event = await prisma.events.findUnique({
      where: { id: eventIdNumber },
    });
    if (!event) {
      res.status(400).json({ message: "Event not found" });
      return;
    }

    if (event.type === "SOLO") {
      const eventRegistered = await prisma.participant.findFirst({
        where: {
          id: userId,
          events: {
            some: {
              eventId: parseInt(eventId),
              participantId: userId,
            },
          },
        },
      });
      if (!eventRegistered) {
        res.status(400).json({ message: "Event registration not found" });
        return;
      }
      await prisma.participant.update({
        where: {
          id: userId,
        },
        data: {
          events: {
            delete: {
              participantId_eventId: {
                participantId: userId,
                eventId: eventIdNumber,
              },
            },
          },
        },
      });
    } else {
      const eventRegistered = await prisma.participant.findFirst({
        where: {
          id: userId,
          team: {
            some: {
              event: {
                id: parseInt(eventId),
              },
            },
          },
        },
      });
      if (!eventRegistered) {
        res.status(400).json({ message: "Event registration not found" });
        return;
      }
      const team = await prisma.team.findFirst({
        where: {
          eventId: parseInt(eventId),
          participantId: parseInt(userId),
        },
        select: { id: true },
      });

      if (!team) {
        res.status(400).json({ message: "Team not found" });
        return;
      }

      // Delete related members before deleting the team
      await prisma.member.deleteMany({
        where: {
          teamId: team.id,
        },
      });
      await prisma.team.delete({
        where: {
          id: team.id,
        },
      });
      // await prisma.participant.update({
      //   where: {
      //     id: userId,
      //   },
      //   data: {
      //     team: {
      //       delete: {
      //         id: (
      //           await prisma.team.findFirst({
      //             where: {
      //               participantId: userId,
      //               eventId: eventIdNumber,
      //             },
      //             select: { id: true },
      //           })
      //         )?.id,
      //       },
      //     },
      //   },
      // });
    }

    // const { eventId } = req.body; // parsing error, eventId is string, and eventId in db is int
    // await prisma.participantsOnEvents.delete({
    //   where: {
    //     participantId_eventId: {
    //       participantId: participant.id,
    //       eventId: eventIdNumber,
    //     },
    //   },
    // });
    res.status(201).json({ message: "Unregistered for event successfully" });
  } catch (error) {
    console.error("Error unregistering participant from event:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const registeredEvents = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const events = await prisma.participant.findUnique({
      where: { id: userId },
      select: {
        events: true,
        team: { select: { event: true } },
      },
    });
    // const events = await prisma.events.findMany({
    //   where: {
    //     participants: {
    //       some: {
    //         participant: {
    //           id: userId,
    //         },
    //       },
    //     },
    //   },
    // });
    res.status(200).json(events);
  } catch (error) {
    console.error("Error finding user registered events:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// export const eventPopulate = async (req: Request, res: Response) => {
//   try {
//     const { name, type } = req.body;
//     const event = await prisma.events.create({
//       data: {
//         name: name,
//         type: type,
//       },
//     });
//     res.status(200).json("hogaya");
//   } catch (error) {
//     res.status(400).json("nahi hua");
//   }
// };
