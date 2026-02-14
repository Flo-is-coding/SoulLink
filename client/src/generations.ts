export interface BadgeInfo {
  name: string;
  type: string; // gym leader's primary type
  levelCap: number; // highest level of this gym leader's ace
  spriteId: number | null; // PokeAPI badge sprite ID (null = no sprite available)
}

export interface Generation {
  id: number;
  name: string;
  region: string;
  badges: BadgeInfo[];
}

export const GENERATIONS: Generation[] = [
  {
    id: 1,
    name: "Gen I",
    region: "Kanto",
    badges: [
      { name: "Boulder", type: "rock", levelCap: 14, spriteId: 1 },
      { name: "Cascade", type: "water", levelCap: 21, spriteId: 2 },
      { name: "Thunder", type: "electric", levelCap: 24, spriteId: 3 },
      { name: "Rainbow", type: "grass", levelCap: 29, spriteId: 4 },
      { name: "Soul", type: "poison", levelCap: 43, spriteId: 5 },
      { name: "Marsh", type: "psychic", levelCap: 43, spriteId: 6 },
      { name: "Volcano", type: "fire", levelCap: 47, spriteId: 7 },
      { name: "Earth", type: "ground", levelCap: 50, spriteId: 8 },
    ],
  },
  {
    id: 2,
    name: "Gen II",
    region: "Johto",
    badges: [
      { name: "Zephyr", type: "flying", levelCap: 9, spriteId: 9 },
      { name: "Hive", type: "bug", levelCap: 16, spriteId: 10 },
      { name: "Plain", type: "normal", levelCap: 20, spriteId: 11 },
      { name: "Fog", type: "ghost", levelCap: 25, spriteId: 12 },
      { name: "Storm", type: "fighting", levelCap: 30, spriteId: 13 },
      { name: "Mineral", type: "steel", levelCap: 35, spriteId: 14 },
      { name: "Glacier", type: "ice", levelCap: 31, spriteId: 15 },
      { name: "Rising", type: "dragon", levelCap: 40, spriteId: 16 },
    ],
  },
  {
    id: 3,
    name: "Gen III",
    region: "Hoenn",
    badges: [
      { name: "Stone", type: "rock", levelCap: 15, spriteId: 17 },
      { name: "Knuckle", type: "fighting", levelCap: 19, spriteId: 18 },
      { name: "Dynamo", type: "electric", levelCap: 24, spriteId: 19 },
      { name: "Heat", type: "fire", levelCap: 29, spriteId: 20 },
      { name: "Balance", type: "normal", levelCap: 31, spriteId: 21 },
      { name: "Feather", type: "flying", levelCap: 33, spriteId: 22 },
      { name: "Mind", type: "psychic", levelCap: 42, spriteId: 23 },
      { name: "Rain", type: "water", levelCap: 46, spriteId: 24 },
    ],
  },
  {
    id: 4,
    name: "Gen IV",
    region: "Sinnoh",
    badges: [
      { name: "Coal", type: "rock", levelCap: 14, spriteId: 25 },
      { name: "Forest", type: "grass", levelCap: 22, spriteId: 26 },
      { name: "Cobble", type: "fighting", levelCap: 32, spriteId: 27 },
      { name: "Fen", type: "water", levelCap: 37, spriteId: 28 },
      { name: "Relic", type: "ghost", levelCap: 26, spriteId: 29 },
      { name: "Mine", type: "steel", levelCap: 41, spriteId: 30 },
      { name: "Icicle", type: "ice", levelCap: 44, spriteId: 31 },
      { name: "Beacon", type: "electric", levelCap: 50, spriteId: 32 },
    ],
  },
  {
    id: 5,
    name: "Gen V",
    region: "Unova",
    badges: [
      { name: "Trio", type: "normal", levelCap: 14, spriteId: 33 },
      { name: "Basic", type: "normal", levelCap: 20, spriteId: 34 },
      { name: "Insect", type: "bug", levelCap: 23, spriteId: 35 },
      { name: "Bolt", type: "electric", levelCap: 27, spriteId: 36 },
      { name: "Quake", type: "ground", levelCap: 31, spriteId: 37 },
      { name: "Jet", type: "flying", levelCap: 35, spriteId: 38 },
      { name: "Freeze", type: "ice", levelCap: 39, spriteId: 39 },
      { name: "Legend", type: "dragon", levelCap: 43, spriteId: 40 },
    ],
  },
  {
    id: 6,
    name: "Gen VI",
    region: "Kalos",
    badges: [
      { name: "Bug", type: "bug", levelCap: 12, spriteId: 41 },
      { name: "Cliff", type: "rock", levelCap: 25, spriteId: 42 },
      { name: "Rumble", type: "fighting", levelCap: 32, spriteId: 43 },
      { name: "Plant", type: "grass", levelCap: 34, spriteId: 44 },
      { name: "Voltage", type: "electric", levelCap: 37, spriteId: 45 },
      { name: "Fairy", type: "fairy", levelCap: 42, spriteId: 46 },
      { name: "Psychic", type: "psychic", levelCap: 48, spriteId: 47 },
      { name: "Iceberg", type: "ice", levelCap: 59, spriteId: 48 },
    ],
  },
  {
    id: 7,
    name: "Gen VII",
    region: "Alola",
    badges: [
      { name: "Melemele", type: "fighting", levelCap: 15, spriteId: null },
      { name: "Akala", type: "rock", levelCap: 27, spriteId: null },
      { name: "Ula'ula", type: "dark", levelCap: 39, spriteId: null },
      { name: "Poni", type: "dragon", levelCap: 48, spriteId: null },
    ],
  },
  {
    id: 8,
    name: "Gen VIII",
    region: "Galar",
    badges: [
      { name: "Grass", type: "grass", levelCap: 20, spriteId: 49 },
      { name: "Water", type: "water", levelCap: 24, spriteId: 50 },
      { name: "Fire", type: "fire", levelCap: 27, spriteId: 51 },
      { name: "Fighting", type: "fighting", levelCap: 36, spriteId: 52 },
      { name: "Fairy", type: "fairy", levelCap: 38, spriteId: 54 },
      { name: "Rock", type: "rock", levelCap: 42, spriteId: 55 },
      { name: "Dark", type: "dark", levelCap: 46, spriteId: 57 },
      { name: "Dragon", type: "dragon", levelCap: 48, spriteId: 58 },
    ],
  },
  {
    id: 9,
    name: "Gen IX",
    region: "Paldea",
    badges: [
      { name: "Bug", type: "bug", levelCap: 15, spriteId: 62 },
      { name: "Grass", type: "grass", levelCap: 17, spriteId: 63 },
      { name: "Electric", type: "electric", levelCap: 24, spriteId: 64 },
      { name: "Water", type: "water", levelCap: 30, spriteId: 65 },
      { name: "Normal", type: "normal", levelCap: 36, spriteId: 66 },
      { name: "Ghost", type: "ghost", levelCap: 42, spriteId: 67 },
      { name: "Psychic", type: "psychic", levelCap: 45, spriteId: 68 },
      { name: "Ice", type: "ice", levelCap: 48, spriteId: 69 },
    ],
  },
];
