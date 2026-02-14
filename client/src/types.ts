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
