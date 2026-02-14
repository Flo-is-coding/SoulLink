import Database from "better-sqlite3";
import path from "path";

const db = new Database(path.join(__dirname, "..", "soullink.db"));

db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

db.exec(`
  CREATE TABLE IF NOT EXISTS sessions (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    badges INTEGER NOT NULL DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS players (
    id TEXT PRIMARY KEY,
    session_id TEXT NOT NULL,
    name TEXT NOT NULL,
    position INTEGER NOT NULL CHECK (position BETWEEN 1 AND 4),
    FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE,
    UNIQUE (session_id, position)
  );

  CREATE TABLE IF NOT EXISTS box_entries (
    id TEXT PRIMARY KEY,
    session_id TEXT NOT NULL,
    player_id TEXT NOT NULL,
    pokemon_id INTEGER NOT NULL,
    pokemon_name TEXT NOT NULL,
    pokemon_types TEXT,
    nickname TEXT,
    route TEXT,
    is_dead INTEGER NOT NULL DEFAULT 0,
    link_group TEXT NOT NULL,
    FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE,
    FOREIGN KEY (player_id) REFERENCES players(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS slots (
    id TEXT PRIMARY KEY,
    player_id TEXT NOT NULL,
    position INTEGER NOT NULL CHECK (position BETWEEN 1 AND 6),
    box_entry_id TEXT,
    FOREIGN KEY (player_id) REFERENCES players(id) ON DELETE CASCADE,
    FOREIGN KEY (box_entry_id) REFERENCES box_entries(id) ON DELETE SET NULL,
    UNIQUE (player_id, position)
  );
`);

// Migration: add generation column
try {
  db.exec(
    "ALTER TABLE sessions ADD COLUMN generation INTEGER NOT NULL DEFAULT 1"
  );
} catch {
  // Column already exists
}

// Migration: failed encounters tables
db.exec(`
  CREATE TABLE IF NOT EXISTS failed_encounters (
    id TEXT PRIMARY KEY,
    session_id TEXT NOT NULL,
    route TEXT NOT NULL,
    FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS failed_encounter_pokemon (
    id TEXT PRIMARY KEY,
    failed_encounter_id TEXT NOT NULL,
    player_id TEXT NOT NULL,
    pokemon_id INTEGER NOT NULL,
    pokemon_name TEXT NOT NULL,
    pokemon_types TEXT,
    FOREIGN KEY (failed_encounter_id) REFERENCES failed_encounters(id) ON DELETE CASCADE,
    FOREIGN KEY (player_id) REFERENCES players(id) ON DELETE CASCADE
  );
`);

export default db;
