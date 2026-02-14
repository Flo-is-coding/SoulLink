import { v4 as uuid } from "uuid";
import db from "../db";

// ── Types ──

export interface Session {
  id: string;
  name: string;
  created_at: string;
  badges: number;
  generation: number;
  players: Player[];
  box: BoxLink[];
  failedEncounters: FailedEncounter[];
}

export interface FailedEncounterPokemon {
  id: string;
  player_id: string;
  pokemon_id: number;
  pokemon_name: string;
  pokemon_types: string | null;
}

export interface FailedEncounter {
  id: string;
  session_id: string;
  route: string;
  pokemon: FailedEncounterPokemon[];
}

export interface Player {
  id: string;
  session_id: string;
  name: string;
  position: number;
  slots: Slot[];
}

export interface Slot {
  id: string;
  player_id: string;
  position: number;
  box_entry_id: string | null;
  pokemon: BoxEntry | null;
}

export interface BoxEntry {
  id: string;
  session_id: string;
  player_id: string;
  pokemon_id: number;
  pokemon_name: string;
  pokemon_types: string | null;
  nickname: string | null;
  route: string | null;
  is_dead: boolean;
  link_group: string;
  in_team: boolean;
}

export interface BoxLink {
  link_group: string;
  route: string | null;
  is_dead: boolean;
  entries: BoxEntry[];
}

// ── Prepared Statements ──

const stmts = {
  insertSession: db.prepare(
    "INSERT INTO sessions (id, name, generation) VALUES (?, ?, ?)"
  ),
  getSession: db.prepare("SELECT * FROM sessions WHERE id = ?"),
  listSessions: db.prepare("SELECT * FROM sessions ORDER BY created_at DESC"),
  deleteSession: db.prepare("DELETE FROM sessions WHERE id = ?"),
  updateBadges: db.prepare("UPDATE sessions SET badges = ? WHERE id = ?"),

  insertPlayer: db.prepare(
    "INSERT INTO players (id, session_id, name, position) VALUES (?, ?, ?, ?)"
  ),
  getPlayersBySession: db.prepare(
    "SELECT * FROM players WHERE session_id = ? ORDER BY position"
  ),
  deletePlayer: db.prepare("DELETE FROM players WHERE id = ?"),

  insertSlot: db.prepare(
    "INSERT INTO slots (id, player_id, position) VALUES (?, ?, ?)"
  ),
  getSlotsByPlayer: db.prepare(
    "SELECT * FROM slots WHERE player_id = ? ORDER BY position"
  ),
  assignSlot: db.prepare("UPDATE slots SET box_entry_id = ? WHERE id = ?"),
  clearSlot: db.prepare("UPDATE slots SET box_entry_id = NULL WHERE id = ?"),
  clearSlotsByBoxEntry: db.prepare(
    "UPDATE slots SET box_entry_id = NULL WHERE box_entry_id = ?"
  ),
  clearSlotsByLinkGroup: db.prepare(`
    UPDATE slots SET box_entry_id = NULL
    WHERE box_entry_id IN (SELECT id FROM box_entries WHERE link_group = ?)
  `),
  clearAllSlots: db.prepare(`
    UPDATE slots SET box_entry_id = NULL
    WHERE player_id IN (SELECT id FROM players WHERE session_id = ?)
  `),
  swapSlotEntries: db.prepare("UPDATE slots SET box_entry_id = ? WHERE id = ?"),
  getSlotById: db.prepare("SELECT * FROM slots WHERE id = ?"),
  getSlotByPlayerAndPosition: db.prepare(
    "SELECT * FROM slots WHERE player_id = ? AND position = ?"
  ),
  getPlayerById: db.prepare("SELECT * FROM players WHERE id = ?"),

  insertBoxEntry: db.prepare(`
    INSERT INTO box_entries (id, session_id, player_id, pokemon_id, pokemon_name, pokemon_types, nickname, route, link_group)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `),
  getBoxBySession: db.prepare(
    "SELECT * FROM box_entries WHERE session_id = ? ORDER BY rowid"
  ),
  getBoxEntry: db.prepare("SELECT * FROM box_entries WHERE id = ?"),
  getBoxEntriesByLinkGroup: db.prepare(
    "SELECT * FROM box_entries WHERE link_group = ?"
  ),
  updateBoxEntry: db.prepare(
    "UPDATE box_entries SET nickname = ?, route = ? WHERE id = ?"
  ),
  killLinkGroup: db.prepare(
    "UPDATE box_entries SET is_dead = 1 WHERE link_group = ?"
  ),
  reviveBoxEntry: db.prepare(
    "UPDATE box_entries SET is_dead = 0 WHERE id = ?"
  ),

  getNextPlayerPosition: db.prepare(
    "SELECT COALESCE(MAX(position), 0) + 1 as next_pos FROM players WHERE session_id = ?"
  ),

  insertFailedEncounter: db.prepare(
    "INSERT INTO failed_encounters (id, session_id, route) VALUES (?, ?, ?)"
  ),
  insertFailedEncounterPokemon: db.prepare(
    "INSERT INTO failed_encounter_pokemon (id, failed_encounter_id, player_id, pokemon_id, pokemon_name, pokemon_types) VALUES (?, ?, ?, ?, ?, ?)"
  ),
  getFailedEncountersBySession: db.prepare(
    "SELECT * FROM failed_encounters WHERE session_id = ? ORDER BY rowid"
  ),
  getFailedEncounterPokemon: db.prepare(
    "SELECT * FROM failed_encounter_pokemon WHERE failed_encounter_id = ?"
  ),
  deleteFailedEncounter: db.prepare(
    "DELETE FROM failed_encounters WHERE id = ?"
  ),
};

// ── Helpers ──

function boxEntryRow(row: any, inTeam: boolean): BoxEntry {
  return {
    ...row,
    is_dead: !!row.is_dead,
    in_team: inTeam,
  };
}

function buildSlot(slotRow: any, boxEntries: Map<string, any>): Slot {
  const entry = slotRow.box_entry_id
    ? boxEntries.get(slotRow.box_entry_id)
    : null;
  return {
    id: slotRow.id,
    player_id: slotRow.player_id,
    position: slotRow.position,
    box_entry_id: slotRow.box_entry_id,
    pokemon: entry ? boxEntryRow(entry, true) : null,
  };
}

// ── Session CRUD ──

export function createSession(name: string, generation: number = 1): Session {
  const id = uuid();
  stmts.insertSession.run(id, name, generation);
  return getSession(id)!;
}

export function getSession(id: string): Session | null {
  const session = stmts.getSession.get(id) as any;
  if (!session) return null;

  const allBoxEntries = stmts.getBoxBySession.all(id) as any[];
  const boxMap = new Map(allBoxEntries.map((e) => [e.id, e]));

  const inTeamIds = new Set<string>();

  const players = (stmts.getPlayersBySession.all(id) as any[]).map(
    (player) => {
      const slotRows = stmts.getSlotsByPlayer.all(player.id) as any[];
      slotRows.forEach((s) => {
        if (s.box_entry_id) inTeamIds.add(s.box_entry_id);
      });
      return {
        ...player,
        slots: slotRows.map((s) => buildSlot(s, boxMap)),
      };
    }
  );

  const linkGroupMap = new Map<string, BoxLink>();
  for (const entry of allBoxEntries) {
    const existing = linkGroupMap.get(entry.link_group);
    const be = boxEntryRow(entry, inTeamIds.has(entry.id));
    if (existing) {
      existing.entries.push(be);
      if (be.is_dead) existing.is_dead = true;
    } else {
      linkGroupMap.set(entry.link_group, {
        link_group: entry.link_group,
        route: entry.route,
        is_dead: be.is_dead,
        entries: [be],
      });
    }
  }

  const failedEncounterRows = stmts.getFailedEncountersBySession.all(id) as any[];
  const failedEncounters: FailedEncounter[] = failedEncounterRows.map((fe) => ({
    ...fe,
    pokemon: (stmts.getFailedEncounterPokemon.all(fe.id) as any[]).map((p) => ({
      id: p.id,
      player_id: p.player_id,
      pokemon_id: p.pokemon_id,
      pokemon_name: p.pokemon_name,
      pokemon_types: p.pokemon_types,
    })),
  }));

  return {
    ...session,
    players,
    box: Array.from(linkGroupMap.values()),
    failedEncounters,
  };
}

export function listSessions(): Omit<Session, "players" | "box" | "failedEncounters">[] {
  return stmts.listSessions.all() as any[];
}

export function deleteSession(id: string): boolean {
  return stmts.deleteSession.run(id).changes > 0;
}

export function updateBadges(sessionId: string, badges: number): void {
  stmts.updateBadges.run(badges, sessionId);
}

// ── Player CRUD ──

export function addPlayer(sessionId: string, name: string): void {
  const { next_pos } = stmts.getNextPlayerPosition.get(sessionId) as any;
  if (next_pos > 4) throw new Error("Maximum 4 players per session");

  const playerId = uuid();
  stmts.insertPlayer.run(playerId, sessionId, name, next_pos);

  for (let i = 1; i <= 6; i++) {
    stmts.insertSlot.run(uuid(), playerId, i);
  }
}

export function removePlayer(playerId: string): void {
  stmts.deletePlayer.run(playerId);
}

// ── Box Operations ──

export interface AddToBoxInput {
  playerId: string;
  pokemonId: number;
  pokemonName: string;
  pokemonTypes: string | null;
  nickname: string | null;
}

export function addToBox(
  sessionId: string,
  entries: AddToBoxInput[],
  route: string | null
): void {
  const linkGroup = uuid();
  const insert = db.transaction(() => {
    for (const entry of entries) {
      stmts.insertBoxEntry.run(
        uuid(),
        sessionId,
        entry.playerId,
        entry.pokemonId,
        entry.pokemonName,
        entry.pokemonTypes,
        entry.nickname,
        route,
        linkGroup
      );
    }
  });
  insert();
}

export function updateBoxEntry(
  entryId: string,
  nickname: string | null,
  route: string | null
): void {
  stmts.updateBoxEntry.run(nickname, route, entryId);
}

export function killLinkGroup(linkGroup: string): void {
  const kill = db.transaction(() => {
    stmts.clearSlotsByLinkGroup.run(linkGroup);
    stmts.killLinkGroup.run(linkGroup);
  });
  kill();
}

// ── Slot Operations ──

export function assignToSlot(slotId: string, boxEntryId: string): void {
  const entry = stmts.getBoxEntry.get(boxEntryId) as any;
  if (!entry) throw new Error("Box entry not found");
  if (entry.is_dead) throw new Error("Cannot assign a dead Pokemon to a slot");

  const slot = stmts.getSlotById.get(slotId) as any;
  if (!slot) throw new Error("Slot not found");

  const assign = db.transaction(() => {
    // Remove this entry from any other slot
    stmts.clearSlotsByBoxEntry.run(boxEntryId);
    // Assign to the target slot
    stmts.assignSlot.run(boxEntryId, slotId);

    // Auto-assign linked Pokemon to same slot position for other players
    const linkedEntries = stmts.getBoxEntriesByLinkGroup.all(
      entry.link_group
    ) as any[];
    for (const linked of linkedEntries) {
      if (linked.id === boxEntryId) continue; // skip self
      if (linked.is_dead) continue; // skip dead

      // Find this player's slot at the same position
      const targetSlot = stmts.getSlotByPlayerAndPosition.get(
        linked.player_id,
        slot.position
      ) as any;
      if (!targetSlot) continue;

      // Only auto-assign if the target slot is empty
      if (targetSlot.box_entry_id) continue;

      // Remove linked entry from any other slot
      stmts.clearSlotsByBoxEntry.run(linked.id);
      stmts.assignSlot.run(linked.id, targetSlot.id);
    }
  });
  assign();
}

export function clearSlot(slotId: string): void {
  const slot = stmts.getSlotById.get(slotId) as any;
  if (!slot || !slot.box_entry_id) return;

  const entry = stmts.getBoxEntry.get(slot.box_entry_id) as any;
  if (!entry) {
    stmts.clearSlot.run(slotId);
    return;
  }

  const clear = db.transaction(() => {
    // Clear the requested slot
    stmts.clearSlot.run(slotId);

    // Also clear linked Pokemon from other players' slots
    const linkedEntries = stmts.getBoxEntriesByLinkGroup.all(
      entry.link_group
    ) as any[];
    for (const linked of linkedEntries) {
      if (linked.id === entry.id) continue;
      stmts.clearSlotsByBoxEntry.run(linked.id);
    }
  });
  clear();
}

export function clearAllSlots(sessionId: string): void {
  stmts.clearAllSlots.run(sessionId);
}

export function swapSlots(slotIdA: string, slotIdB: string): void {
  const a = stmts.getSlotById.get(slotIdA) as any;
  const b = stmts.getSlotById.get(slotIdB) as any;
  if (!a || !b) return;

  const swap = db.transaction(() => {
    stmts.swapSlotEntries.run(b.box_entry_id, slotIdA);
    stmts.swapSlotEntries.run(a.box_entry_id, slotIdB);
  });
  swap();
}

// ── Failed Encounters ──

export interface FailedEncounterInput {
  playerId: string;
  pokemonId: number;
  pokemonName: string;
  pokemonTypes: string | null;
}

export function addFailedEncounter(
  sessionId: string,
  route: string,
  pokemon: FailedEncounterInput[]
): void {
  const feId = uuid();
  const insert = db.transaction(() => {
    stmts.insertFailedEncounter.run(feId, sessionId, route);
    for (const p of pokemon) {
      stmts.insertFailedEncounterPokemon.run(
        uuid(), feId, p.playerId, p.pokemonId, p.pokemonName, p.pokemonTypes
      );
    }
  });
  insert();
}

export function removeFailedEncounter(encounterId: string): void {
  stmts.deleteFailedEncounter.run(encounterId);
}
