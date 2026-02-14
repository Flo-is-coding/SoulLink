import { v4 as uuid } from "uuid";
import { getContainer } from "../db";

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

// ── Document shape stored in Cosmos ──

interface SessionDoc {
  id: string;
  name: string;
  created_at: string;
  badges: number;
  generation: number;
  players: PlayerDoc[];
  box_entries: BoxEntryDoc[];
  failed_encounters: FailedEncounterDoc[];
}

interface PlayerDoc {
  id: string;
  name: string;
  position: number;
  slots: SlotDoc[];
}

interface SlotDoc {
  id: string;
  position: number;
  box_entry_id: string | null;
}

interface BoxEntryDoc {
  id: string;
  player_id: string;
  pokemon_id: number;
  pokemon_name: string;
  pokemon_types: string | null;
  nickname: string | null;
  route: string | null;
  is_dead: boolean;
  link_group: string;
}

interface FailedEncounterDoc {
  id: string;
  route: string;
  pokemon: FailedEncounterPokemon[];
}

// ── Helpers ──

async function readDoc(id: string): Promise<SessionDoc | null> {
  try {
    const { resource } = await getContainer().item(id, id).read<SessionDoc>();
    return resource ?? null;
  } catch (err: any) {
    if (err.code === 404) return null;
    throw err;
  }
}

async function replaceDoc(doc: SessionDoc): Promise<void> {
  await getContainer().item(doc.id, doc.id).replace(doc);
}

function docToSession(doc: SessionDoc): Session {
  // Determine which box entries are in a team slot
  const inTeamIds = new Set<string>();
  for (const player of doc.players) {
    for (const slot of player.slots) {
      if (slot.box_entry_id) inTeamIds.add(slot.box_entry_id);
    }
  }

  // Build box entry map
  const boxEntryMap = new Map<string, BoxEntryDoc>();
  for (const entry of doc.box_entries) {
    boxEntryMap.set(entry.id, entry);
  }

  // Build players with resolved slots
  const players: Player[] = doc.players.map((p) => ({
    id: p.id,
    session_id: doc.id,
    name: p.name,
    position: p.position,
    slots: p.slots.map((s) => {
      const entry = s.box_entry_id ? boxEntryMap.get(s.box_entry_id) : null;
      return {
        id: s.id,
        player_id: p.id,
        position: s.position,
        box_entry_id: s.box_entry_id,
        pokemon: entry
          ? {
              ...entry,
              session_id: doc.id,
              is_dead: entry.is_dead,
              in_team: true,
            }
          : null,
      };
    }),
  }));

  // Group box entries by link_group
  const linkGroupMap = new Map<string, BoxLink>();
  for (const entry of doc.box_entries) {
    const be: BoxEntry = {
      ...entry,
      session_id: doc.id,
      in_team: inTeamIds.has(entry.id),
    };
    const existing = linkGroupMap.get(entry.link_group);
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

  // Build failed encounters
  const failedEncounters: FailedEncounter[] = doc.failed_encounters.map((fe) => ({
    id: fe.id,
    session_id: doc.id,
    route: fe.route,
    pokemon: fe.pokemon,
  }));

  return {
    id: doc.id,
    name: doc.name,
    created_at: doc.created_at,
    badges: doc.badges,
    generation: doc.generation,
    players,
    box: Array.from(linkGroupMap.values()),
    failedEncounters,
  };
}

// ── Session CRUD ──

export async function createSession(
  name: string,
  generation: number = 1
): Promise<Session> {
  const doc: SessionDoc = {
    id: uuid(),
    name,
    created_at: new Date().toISOString(),
    badges: 0,
    generation,
    players: [],
    box_entries: [],
    failed_encounters: [],
  };
  await getContainer().items.create(doc);
  return docToSession(doc);
}

export async function getSession(id: string): Promise<Session | null> {
  const doc = await readDoc(id);
  if (!doc) return null;
  return docToSession(doc);
}

export async function listSessions(): Promise<
  Omit<Session, "players" | "box" | "failedEncounters">[]
> {
  const { resources } = await getContainer()
    .items.query<SessionDoc>(
      "SELECT c.id, c.name, c.created_at, c.generation FROM c ORDER BY c.created_at DESC"
    )
    .fetchAll();
  return resources;
}

export async function deleteSession(id: string): Promise<boolean> {
  try {
    await getContainer().item(id, id).delete();
    return true;
  } catch (err: any) {
    if (err.code === 404) return false;
    throw err;
  }
}

export async function updateBadges(
  sessionId: string,
  badges: number
): Promise<void> {
  const doc = await readDoc(sessionId);
  if (!doc) return;
  doc.badges = badges;
  await replaceDoc(doc);
}

// ── Player CRUD ──

export async function addPlayer(
  sessionId: string,
  name: string
): Promise<void> {
  const doc = await readDoc(sessionId);
  if (!doc) return;

  const maxPos = doc.players.reduce((m, p) => Math.max(m, p.position), 0);
  if (maxPos >= 4) throw new Error("Maximum 4 players per session");

  const playerId = uuid();
  const slots: SlotDoc[] = [];
  for (let i = 1; i <= 6; i++) {
    slots.push({ id: uuid(), position: i, box_entry_id: null });
  }

  doc.players.push({
    id: playerId,
    name,
    position: maxPos + 1,
    slots,
  });

  await replaceDoc(doc);
}

export async function removePlayer(playerId: string): Promise<void> {
  // We need the sessionId — query for it
  const { resources } = await getContainer()
    .items.query<SessionDoc>({
      query: "SELECT * FROM c WHERE ARRAY_CONTAINS(c.players, {id: @pid}, true)",
      parameters: [{ name: "@pid", value: playerId }],
    })
    .fetchAll();

  if (resources.length === 0) return;
  const doc = resources[0];

  // Remove player's box entries
  doc.box_entries = doc.box_entries.filter((e) => e.player_id !== playerId);
  // Remove player
  doc.players = doc.players.filter((p) => p.id !== playerId);

  await replaceDoc(doc);
}

// ── Box Operations ──

export interface AddToBoxInput {
  playerId: string;
  pokemonId: number;
  pokemonName: string;
  pokemonTypes: string | null;
  nickname: string | null;
}

export async function addToBox(
  sessionId: string,
  entries: AddToBoxInput[],
  route: string | null
): Promise<void> {
  const doc = await readDoc(sessionId);
  if (!doc) return;

  const linkGroup = uuid();
  for (const entry of entries) {
    doc.box_entries.push({
      id: uuid(),
      player_id: entry.playerId,
      pokemon_id: entry.pokemonId,
      pokemon_name: entry.pokemonName,
      pokemon_types: entry.pokemonTypes,
      nickname: entry.nickname,
      route,
      is_dead: false,
      link_group: linkGroup,
    });
  }

  await replaceDoc(doc);
}

export async function updateBoxEntry(
  entryId: string,
  nickname: string | null,
  route: string | null
): Promise<void> {
  // Find which session contains this entry
  const { resources } = await getContainer()
    .items.query<SessionDoc>({
      query:
        "SELECT * FROM c WHERE ARRAY_CONTAINS(c.box_entries, {id: @eid}, true)",
      parameters: [{ name: "@eid", value: entryId }],
    })
    .fetchAll();

  if (resources.length === 0) return;
  const doc = resources[0];

  const entry = doc.box_entries.find((e) => e.id === entryId);
  if (entry) {
    entry.nickname = nickname;
    entry.route = route;
  }

  await replaceDoc(doc);
}

export async function killLinkGroup(linkGroup: string): Promise<void> {
  const { resources } = await getContainer()
    .items.query<SessionDoc>({
      query:
        "SELECT * FROM c WHERE ARRAY_CONTAINS(c.box_entries, {link_group: @lg}, true)",
      parameters: [{ name: "@lg", value: linkGroup }],
    })
    .fetchAll();

  if (resources.length === 0) return;
  const doc = resources[0];

  // Mark all entries in the link group as dead
  for (const entry of doc.box_entries) {
    if (entry.link_group === linkGroup) {
      entry.is_dead = true;
    }
  }

  // Clear slots that reference dead entries
  const deadIds = new Set(
    doc.box_entries.filter((e) => e.link_group === linkGroup).map((e) => e.id)
  );
  for (const player of doc.players) {
    for (const slot of player.slots) {
      if (slot.box_entry_id && deadIds.has(slot.box_entry_id)) {
        slot.box_entry_id = null;
      }
    }
  }

  await replaceDoc(doc);
}

// ── Slot Operations ──

export async function assignToSlot(
  slotId: string,
  boxEntryId: string
): Promise<void> {
  const { resources } = await getContainer()
    .items.query<SessionDoc>({
      query:
        "SELECT * FROM c WHERE ARRAY_CONTAINS(c.box_entries, {id: @eid}, true)",
      parameters: [{ name: "@eid", value: boxEntryId }],
    })
    .fetchAll();

  if (resources.length === 0) return;
  const doc = resources[0];

  const entry = doc.box_entries.find((e) => e.id === boxEntryId);
  if (!entry) throw new Error("Box entry not found");
  if (entry.is_dead) throw new Error("Cannot assign a dead Pokemon to a slot");

  // Find the target slot and its position
  let targetSlot: SlotDoc | null = null;
  let targetPlayer: PlayerDoc | null = null;
  for (const player of doc.players) {
    const slot = player.slots.find((s) => s.id === slotId);
    if (slot) {
      targetSlot = slot;
      targetPlayer = player;
      break;
    }
  }
  if (!targetSlot || !targetPlayer) throw new Error("Slot not found");

  // Remove this entry from any other slot
  for (const player of doc.players) {
    for (const slot of player.slots) {
      if (slot.box_entry_id === boxEntryId) {
        slot.box_entry_id = null;
      }
    }
  }

  // Assign to the target slot
  targetSlot.box_entry_id = boxEntryId;

  // Auto-assign linked Pokemon to same slot position for other players
  const linkedEntries = doc.box_entries.filter(
    (e) => e.link_group === entry.link_group && e.id !== boxEntryId && !e.is_dead
  );
  for (const linked of linkedEntries) {
    const player = doc.players.find((p) => p.id === linked.player_id);
    if (!player) continue;

    const samePositionSlot = player.slots.find(
      (s) => s.position === targetSlot!.position
    );
    if (!samePositionSlot || samePositionSlot.box_entry_id) continue;

    // Remove linked entry from any other slot
    for (const p of doc.players) {
      for (const s of p.slots) {
        if (s.box_entry_id === linked.id) {
          s.box_entry_id = null;
        }
      }
    }

    samePositionSlot.box_entry_id = linked.id;
  }

  await replaceDoc(doc);
}

export async function clearSlot(slotId: string): Promise<void> {
  // Find the session containing this slot
  let doc: SessionDoc | null = null;
  let targetSlot: SlotDoc | null = null;

  const { resources } = await getContainer()
    .items.query<SessionDoc>("SELECT * FROM c")
    .fetchAll();

  for (const d of resources) {
    for (const player of d.players) {
      const slot = player.slots.find((s) => s.id === slotId);
      if (slot) {
        doc = d;
        targetSlot = slot;
        break;
      }
    }
    if (doc) break;
  }

  if (!doc || !targetSlot || !targetSlot.box_entry_id) return;

  const entry = doc.box_entries.find((e) => e.id === targetSlot!.box_entry_id);
  if (!entry) {
    targetSlot.box_entry_id = null;
    await replaceDoc(doc);
    return;
  }

  // Clear the requested slot
  targetSlot.box_entry_id = null;

  // Also clear linked Pokemon from other players' slots
  const linkedEntries = doc.box_entries.filter(
    (e) => e.link_group === entry.link_group && e.id !== entry.id
  );
  for (const linked of linkedEntries) {
    for (const player of doc.players) {
      for (const slot of player.slots) {
        if (slot.box_entry_id === linked.id) {
          slot.box_entry_id = null;
        }
      }
    }
  }

  await replaceDoc(doc);
}

export async function clearAllSlots(sessionId: string): Promise<void> {
  const doc = await readDoc(sessionId);
  if (!doc) return;

  for (const player of doc.players) {
    for (const slot of player.slots) {
      slot.box_entry_id = null;
    }
  }

  await replaceDoc(doc);
}

export async function swapSlots(
  slotIdA: string,
  slotIdB: string
): Promise<void> {
  // Find session containing these slots
  const { resources } = await getContainer()
    .items.query<SessionDoc>("SELECT * FROM c")
    .fetchAll();

  let doc: SessionDoc | null = null;
  let slotA: SlotDoc | null = null;
  let slotB: SlotDoc | null = null;

  for (const d of resources) {
    for (const player of d.players) {
      for (const slot of player.slots) {
        if (slot.id === slotIdA) slotA = slot;
        if (slot.id === slotIdB) slotB = slot;
      }
    }
    if (slotA && slotB) {
      doc = d;
      break;
    }
    slotA = null;
    slotB = null;
  }

  if (!doc || !slotA || !slotB) return;

  const tmp = slotA.box_entry_id;
  slotA.box_entry_id = slotB.box_entry_id;
  slotB.box_entry_id = tmp;

  await replaceDoc(doc);
}

// ── Failed Encounters ──

export interface FailedEncounterInput {
  playerId: string;
  pokemonId: number;
  pokemonName: string;
  pokemonTypes: string | null;
}

export async function addFailedEncounter(
  sessionId: string,
  route: string,
  pokemon: FailedEncounterInput[]
): Promise<void> {
  const doc = await readDoc(sessionId);
  if (!doc) return;

  doc.failed_encounters.push({
    id: uuid(),
    route,
    pokemon: pokemon.map((p) => ({
      id: uuid(),
      player_id: p.playerId,
      pokemon_id: p.pokemonId,
      pokemon_name: p.pokemonName,
      pokemon_types: p.pokemonTypes,
    })),
  });

  await replaceDoc(doc);
}

export async function removeFailedEncounter(
  encounterId: string
): Promise<void> {
  const { resources } = await getContainer()
    .items.query<SessionDoc>({
      query:
        "SELECT * FROM c WHERE ARRAY_CONTAINS(c.failed_encounters, {id: @fid}, true)",
      parameters: [{ name: "@fid", value: encounterId }],
    })
    .fetchAll();

  if (resources.length === 0) return;
  const doc = resources[0];

  doc.failed_encounters = doc.failed_encounters.filter(
    (fe) => fe.id !== encounterId
  );

  await replaceDoc(doc);
}
