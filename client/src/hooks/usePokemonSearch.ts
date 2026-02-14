import { useState, useEffect, useMemo } from "react";

export interface PokemonEntry {
  id: number;
  name: string;
}

let cachedList: PokemonEntry[] | null = null;
const typeCache: Record<number, string[]> = {};

export function usePokemonSearch(query: string, genFilter: number | null, limit: number = 50) {
  const [allPokemon, setAllPokemon] = useState<PokemonEntry[]>(
    cachedList || []
  );
  const [loading, setLoading] = useState(!cachedList);

  useEffect(() => {
    if (cachedList) return;
    setLoading(true);
    fetch("https://pokeapi.co/api/v2/pokemon-species?limit=1500")
      .then((r) => r.json())
      .then((data) => {
        const list: PokemonEntry[] = data.results.map(
          (p: { name: string; url: string }) => {
            const id = parseInt(p.url.split("/").filter(Boolean).pop()!);
            return { id, name: p.name };
          }
        );
        list.sort((a, b) => a.id - b.id);
        cachedList = list;
        setAllPokemon(list);
        setLoading(false);
      });
  }, []);

  const GEN_RANGES: Record<number, [number, number]> = {
    1: [1, 151],
    2: [152, 251],
    3: [252, 386],
    4: [387, 493],
    5: [494, 649],
    6: [650, 721],
    7: [722, 809],
    8: [810, 905],
    9: [906, 1025],
  };

  const filtered = useMemo(() => {
    let list = allPokemon;
    if (genFilter && GEN_RANGES[genFilter]) {
      const [min, max] = GEN_RANGES[genFilter];
      list = list.filter((p) => p.id >= min && p.id <= max);
    }
    if (query.trim()) {
      const q = query.toLowerCase().trim();
      list = list.filter(
        (p) => p.name.includes(q) || p.id.toString() === q
      );
    }
    return list;
  }, [allPokemon, query, genFilter]);

  const pokemon = useMemo(() => filtered.slice(0, limit), [filtered, limit]);

  return { pokemon, loading, totalCount: filtered.length };
}

// Fetch types for a specific Pokemon (cached)
export async function fetchPokemonTypes(
  pokemonId: number
): Promise<string[]> {
  if (typeCache[pokemonId]) return typeCache[pokemonId];

  const res = await fetch(
    `https://pokeapi.co/api/v2/pokemon/${pokemonId}`
  );
  const data = await res.json();
  const types: string[] = data.types.map(
    (t: { type: { name: string } }) => t.type.name
  );
  typeCache[pokemonId] = types;
  return types;
}
