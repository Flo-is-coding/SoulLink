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

function broadcastState(io: Server, sessionId: string) {
  const session = getSession(sessionId);
  io.to(sessionId).emit("session:state", session);
}

export function registerSessionHandler(io: Server, socket: Socket) {
  socket.on("session:join", (sessionId: string) => {
    socket.join(sessionId);
    const session = getSession(sessionId);
    if (session) {
      socket.emit("session:state", session);
    }
  });

  socket.on("player:add", (data: { sessionId: string; name: string }) => {
    try {
      addPlayer(data.sessionId, data.name);
      broadcastState(io, data.sessionId);
    } catch (err: any) {
      socket.emit("error", { message: err.message });
    }
  });

  socket.on("player:remove", (data: { sessionId: string; playerId: string }) => {
    removePlayer(data.playerId);
    broadcastState(io, data.sessionId);
  });

  // ── Box Events ──

  socket.on(
    "box:add",
    (data: {
      sessionId: string;
      entries: AddToBoxInput[];
      route: string | null;
    }) => {
      try {
        addToBox(data.sessionId, data.entries, data.route);
        broadcastState(io, data.sessionId);
      } catch (err: any) {
        socket.emit("error", { message: err.message });
      }
    }
  );

  socket.on(
    "box:update",
    (data: {
      sessionId: string;
      entryId: string;
      nickname: string | null;
      route: string | null;
    }) => {
      updateBoxEntry(data.entryId, data.nickname, data.route);
      broadcastState(io, data.sessionId);
    }
  );

  socket.on(
    "box:kill-link",
    (data: { sessionId: string; linkGroup: string }) => {
      killLinkGroup(data.linkGroup);
      broadcastState(io, data.sessionId);
    }
  );

  // ── Slot Events ──

  socket.on(
    "slot:assign",
    (data: { sessionId: string; slotId: string; boxEntryId: string }) => {
      try {
        assignToSlot(data.slotId, data.boxEntryId);
        broadcastState(io, data.sessionId);
      } catch (err: any) {
        socket.emit("error", { message: err.message });
      }
    }
  );

  socket.on("slot:clear", (data: { sessionId: string; slotId: string }) => {
    clearSlot(data.slotId);
    broadcastState(io, data.sessionId);
  });

  socket.on("slot:clear-all", (data: { sessionId: string }) => {
    clearAllSlots(data.sessionId);
    broadcastState(io, data.sessionId);
  });

  socket.on(
    "slot:swap",
    (data: { sessionId: string; slotIdA: string; slotIdB: string }) => {
      swapSlots(data.slotIdA, data.slotIdB);
      broadcastState(io, data.sessionId);
    }
  );

  // ── Session Events ──

  socket.on(
    "session:update-badges",
    (data: { sessionId: string; badges: number }) => {
      updateBadges(data.sessionId, data.badges);
      broadcastState(io, data.sessionId);
    }
  );

  // ── Failed Encounters ──

  socket.on(
    "encounter:failed",
    (data: { sessionId: string; route: string; pokemon: FailedEncounterInput[] }) => {
      addFailedEncounter(data.sessionId, data.route, data.pokemon);
      broadcastState(io, data.sessionId);
    }
  );

  socket.on(
    "encounter:remove-failed",
    (data: { sessionId: string; encounterId: string }) => {
      removeFailedEncounter(data.encounterId);
      broadcastState(io, data.sessionId);
    }
  );
}
