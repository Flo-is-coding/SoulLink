export interface BadgeInfo {
  name: string;
  type: string; // gym leader's primary type
  levelCap: number; // highest level of this gym leader's ace
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
      { name: "Boulder", type: "rock", levelCap: 14 },
      { name: "Cascade", type: "water", levelCap: 21 },
      { name: "Thunder", type: "electric", levelCap: 24 },
      { name: "Rainbow", type: "grass", levelCap: 29 },
      { name: "Soul", type: "poison", levelCap: 43 },
      { name: "Marsh", type: "psychic", levelCap: 43 },
      { name: "Volcano", type: "fire", levelCap: 47 },
      { name: "Earth", type: "ground", levelCap: 50 },
    ],
  },
  {
    id: 2,
    name: "Gen II",
    region: "Johto",
    badges: [
      { name: "Zephyr", type: "flying", levelCap: 9 },
      { name: "Insect", type: "bug", levelCap: 16 },
      { name: "Plain", type: "normal", levelCap: 20 },
      { name: "Fog", type: "ghost", levelCap: 25 },
      { name: "Storm", type: "fighting", levelCap: 30 },
      { name: "Mineral", type: "steel", levelCap: 35 },
      { name: "Glacier", type: "ice", levelCap: 31 },
      { name: "Rising", type: "dragon", levelCap: 40 },
    ],
  },
  {
    id: 3,
    name: "Gen III",
    region: "Hoenn",
    badges: [
      { name: "Stone", type: "rock", levelCap: 15 },
      { name: "Knuckle", type: "fighting", levelCap: 19 },
      { name: "Dynamo", type: "electric", levelCap: 24 },
      { name: "Heat", type: "fire", levelCap: 29 },
      { name: "Balance", type: "normal", levelCap: 31 },
      { name: "Feather", type: "flying", levelCap: 33 },
      { name: "Mind", type: "psychic", levelCap: 42 },
      { name: "Rain", type: "water", levelCap: 46 },
    ],
  },
  {
    id: 4,
    name: "Gen IV",
    region: "Sinnoh",
    badges: [
      { name: "Coal", type: "rock", levelCap: 14 },
      { name: "Forest", type: "grass", levelCap: 22 },
      { name: "Cobble", type: "fighting", levelCap: 32 },
      { name: "Fen", type: "water", levelCap: 37 },
      { name: "Relic", type: "ghost", levelCap: 26 },
      { name: "Mine", type: "steel", levelCap: 41 },
      { name: "Icicle", type: "ice", levelCap: 44 },
      { name: "Beacon", type: "electric", levelCap: 50 },
    ],
  },
  {
    id: 5,
    name: "Gen V",
    region: "Unova",
    badges: [
      { name: "Trio", type: "normal", levelCap: 14 },
      { name: "Basic", type: "normal", levelCap: 20 },
      { name: "Insect", type: "bug", levelCap: 23 },
      { name: "Bolt", type: "electric", levelCap: 27 },
      { name: "Quake", type: "ground", levelCap: 31 },
      { name: "Jet", type: "flying", levelCap: 35 },
      { name: "Freeze", type: "ice", levelCap: 39 },
      { name: "Legend", type: "dragon", levelCap: 43 },
    ],
  },
  {
    id: 6,
    name: "Gen VI",
    region: "Kalos",
    badges: [
      { name: "Bug", type: "bug", levelCap: 12 },
      { name: "Cliff", type: "rock", levelCap: 25 },
      { name: "Rumble", type: "fighting", levelCap: 32 },
      { name: "Plant", type: "grass", levelCap: 34 },
      { name: "Voltage", type: "electric", levelCap: 37 },
      { name: "Fairy", type: "fairy", levelCap: 42 },
      { name: "Psychic", type: "psychic", levelCap: 48 },
      { name: "Iceberg", type: "ice", levelCap: 59 },
    ],
  },
  {
    id: 7,
    name: "Gen VII",
    region: "Alola",
    badges: [
      { name: "Melemele", type: "fighting", levelCap: 15 },
      { name: "Akala", type: "rock", levelCap: 27 },
      { name: "Ula'ula", type: "dark", levelCap: 39 },
      { name: "Poni", type: "dragon", levelCap: 48 },
    ],
  },
  {
    id: 8,
    name: "Gen VIII",
    region: "Galar",
    badges: [
      { name: "Grass", type: "grass", levelCap: 20 },
      { name: "Water", type: "water", levelCap: 24 },
      { name: "Fire", type: "fire", levelCap: 27 },
      { name: "Fighting", type: "fighting", levelCap: 36 },
      { name: "Fairy", type: "fairy", levelCap: 38 },
      { name: "Rock", type: "rock", levelCap: 42 },
      { name: "Dark", type: "dark", levelCap: 46 },
      { name: "Dragon", type: "dragon", levelCap: 48 },
    ],
  },
  {
    id: 9,
    name: "Gen IX",
    region: "Paldea",
    badges: [
      { name: "Bug", type: "bug", levelCap: 15 },
      { name: "Grass", type: "grass", levelCap: 17 },
      { name: "Electric", type: "electric", levelCap: 24 },
      { name: "Water", type: "water", levelCap: 30 },
      { name: "Normal", type: "normal", levelCap: 36 },
      { name: "Ghost", type: "ghost", levelCap: 42 },
      { name: "Psychic", type: "psychic", levelCap: 45 },
      { name: "Ice", type: "ice", levelCap: 48 },
    ],
  },
];
