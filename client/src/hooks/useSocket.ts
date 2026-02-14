import { useEffect, useRef, useState, useCallback } from "react";
import { io, Socket } from "socket.io-client";
import type { Session } from "../types";
import { API_BASE } from "../config";

interface AddToBoxInput {
  playerId: string;
  pokemonId: number;
  pokemonName: string;
  pokemonTypes: string | null;
  nickname: string | null;
}

export function useSocket(sessionId: string | undefined) {
  const socketRef = useRef<Socket | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    if (!sessionId) return;

    const socket = io(API_BASE || undefined, { autoConnect: true });
    socketRef.current = socket;

    socket.on("connect", () => {
      setConnected(true);
      socket.emit("session:join", sessionId);
    });

    socket.on("disconnect", () => setConnected(false));
    socket.on("session:state", (data: Session) => setSession(data));

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [sessionId]);

  const emit = useCallback(
    (event: string, data: any) => {
      socketRef.current?.emit(event, { sessionId, ...data });
    },
    [sessionId]
  );

  const addPlayer = useCallback(
    (name: string) => emit("player:add", { name }),
    [emit]
  );

  const removePlayer = useCallback(
    (playerId: string) => emit("player:remove", { playerId }),
    [emit]
  );

  const addToBox = useCallback(
    (entries: AddToBoxInput[], route: string | null) =>
      emit("box:add", { entries, route }),
    [emit]
  );

  const updateBoxEntry = useCallback(
    (entryId: string, nickname: string | null, route: string | null) =>
      emit("box:update", { entryId, nickname, route }),
    [emit]
  );

  const killLinkGroup = useCallback(
    (linkGroup: string) => emit("box:kill-link", { linkGroup }),
    [emit]
  );

  const assignToSlot = useCallback(
    (slotId: string, boxEntryId: string) =>
      emit("slot:assign", { slotId, boxEntryId }),
    [emit]
  );

  const clearSlot = useCallback(
    (slotId: string) => emit("slot:clear", { slotId }),
    [emit]
  );

  const clearAllSlots = useCallback(
    () => emit("slot:clear-all", {}),
    [emit]
  );

  const swapSlots = useCallback(
    (slotIdA: string, slotIdB: string) =>
      emit("slot:swap", { slotIdA, slotIdB }),
    [emit]
  );

  const updateBadges = useCallback(
    (badges: number) => emit("session:update-badges", { badges }),
    [emit]
  );

  const addFailedEncounter = useCallback(
    (
      route: string,
      pokemon: {
        playerId: string;
        pokemonId: number;
        pokemonName: string;
        pokemonTypes: string | null;
      }[]
    ) => emit("encounter:failed", { route, pokemon }),
    [emit]
  );

  const removeFailedEncounter = useCallback(
    (encounterId: string) => emit("encounter:remove-failed", { encounterId }),
    [emit]
  );

  return {
    session,
    connected,
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
  };
}
