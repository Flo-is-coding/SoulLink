import { Server, Socket } from "socket.io";
import {
  getSession,
  addPlayer,
  removePlayer,
  addToBox,
  updateBoxEntry,
  killLinkGroup,
  assignToSlot,
  clearSlot,
  clearAllSlots,
  swapSlots,
  updateBadges,
  addFailedEncounter,
  removeFailedEncounter,
  type AddToBoxInput,
  type FailedEncounterInput,
} from "../repositories/sessionRepository";

async function broadcastState(io: Server, sessionId: string) {
  const session = await getSession(sessionId);
  io.to(sessionId).emit("session:state", session);
}

export function registerSessionHandler(io: Server, socket: Socket) {
  socket.on("session:join", async (sessionId: string) => {
    socket.join(sessionId);
    const session = await getSession(sessionId);
    if (session) {
      socket.emit("session:state", session);
    }
  });

  socket.on("player:add", async (data: { sessionId: string; name: string }) => {
    try {
      await addPlayer(data.sessionId, data.name);
      await broadcastState(io, data.sessionId);
    } catch (err: any) {
      socket.emit("error", { message: err.message });
    }
  });

  socket.on("player:remove", async (data: { sessionId: string; playerId: string }) => {
    await removePlayer(data.playerId);
    await broadcastState(io, data.sessionId);
  });

  // ── Box Events ──

  socket.on(
    "box:add",
    async (data: {
      sessionId: string;
      entries: AddToBoxInput[];
      route: string | null;
    }) => {
      try {
        await addToBox(data.sessionId, data.entries, data.route);
        await broadcastState(io, data.sessionId);
      } catch (err: any) {
        socket.emit("error", { message: err.message });
      }
    }
  );

  socket.on(
    "box:update",
    async (data: {
      sessionId: string;
      entryId: string;
      nickname: string | null;
      route: string | null;
    }) => {
      await updateBoxEntry(data.entryId, data.nickname, data.route);
      await broadcastState(io, data.sessionId);
    }
  );

  socket.on(
    "box:kill-link",
    async (data: { sessionId: string; linkGroup: string }) => {
      await killLinkGroup(data.linkGroup);
      await broadcastState(io, data.sessionId);
    }
  );

  // ── Slot Events ──

  socket.on(
    "slot:assign",
    async (data: { sessionId: string; slotId: string; boxEntryId: string }) => {
      try {
        await assignToSlot(data.slotId, data.boxEntryId);
        await broadcastState(io, data.sessionId);
      } catch (err: any) {
        socket.emit("error", { message: err.message });
      }
    }
  );

  socket.on("slot:clear", async (data: { sessionId: string; slotId: string }) => {
    await clearSlot(data.slotId);
    await broadcastState(io, data.sessionId);
  });

  socket.on("slot:clear-all", async (data: { sessionId: string }) => {
    await clearAllSlots(data.sessionId);
    await broadcastState(io, data.sessionId);
  });

  socket.on(
    "slot:swap",
    async (data: { sessionId: string; slotIdA: string; slotIdB: string }) => {
      await swapSlots(data.slotIdA, data.slotIdB);
      await broadcastState(io, data.sessionId);
    }
  );

  // ── Session Events ──

  socket.on(
    "session:update-badges",
    async (data: { sessionId: string; badges: number }) => {
      await updateBadges(data.sessionId, data.badges);
      await broadcastState(io, data.sessionId);
    }
  );

  // ── Failed Encounters ──

  socket.on(
    "encounter:failed",
    async (data: { sessionId: string; route: string; pokemon: FailedEncounterInput[] }) => {
      await addFailedEncounter(data.sessionId, data.route, data.pokemon);
      await broadcastState(io, data.sessionId);
    }
  );

  socket.on(
    "encounter:remove-failed",
    async (data: { sessionId: string; encounterId: string }) => {
      await removeFailedEncounter(data.encounterId);
      await broadcastState(io, data.sessionId);
    }
  );
}
