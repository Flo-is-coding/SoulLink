import { useState, useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
} from "@dnd-kit/core";
import { useSocket } from "../hooks/useSocket";
import AddPlayerForm from "../components/AddPlayerForm";
import SlotGrid from "../components/SlotGrid";
import BoxView from "../components/BoxView";
import PokemonSelector from "../components/PokemonSelector";
import AddEncounterModal from "../components/AddEncounterModal";
import BadgeCounter from "../components/BadgeCounter";
import TypeCoverage from "../components/TypeCoverage";
import RouteOverview from "../components/RouteOverview";
import { TYPE_COLORS } from "../typeUtils";
import type { Slot, BoxEntry } from "../types";
import { GENERATIONS } from "../generations";

const SPRITE_URL =
  "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/";

export default function SessionPage() {
  const { id } = useParams<{ id: string }>();
  const {
    session,
    connected,
    addPlayer,
    removePlayer,
    addToBox,
    killLinkGroup,
    assignToSlot,
    clearSlot,
    clearAllSlots,
    swapSlots,
    updateBadges,
    addFailedEncounter,
    removeFailedEncounter,
  } = useSocket(id);
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);
  const [showEncounterModal, setShowEncounterModal] = useState(false);
  const [dragPokemon, setDragPokemon] = useState<BoxEntry | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  // Build lookup maps for DnD validation
  const { slotToPlayer } = useMemo(() => {
    const stp = new Map<string, string>();
    if (session) {
      for (const player of session.players) {
        for (const slot of player.slots) {
          stp.set(slot.id, player.id);
        }
      }
    }
    return { slotToPlayer: stp };
  }, [session]);

  function handleDragStart(event: DragStartEvent) {
    const data = event.active.data.current;
    if (data?.pokemon) {
      setDragPokemon(data.pokemon);
    }
  }

  function handleDragEnd(event: DragEndEvent) {
    setDragPokemon(null);
    const { active, over } = event;
    if (!over) return;

    const activeStr = active.id as string;
    const overStr = over.id as string;

    // Can only drop on slots
    if (!overStr.startsWith("slot:")) return;
    const targetSlotId = overStr.slice(5);
    const targetPlayerId = slotToPlayer.get(targetSlotId);

    if (activeStr.startsWith("box:")) {
      // Box entry → team slot
      const boxEntryId = activeStr.slice(4);
      const entry = dragPokemon || (active.data.current?.pokemon as BoxEntry);
      if (entry && entry.player_id === targetPlayerId) {
        assignToSlot(targetSlotId, boxEntryId);
      }
    } else if (activeStr.startsWith("slot:")) {
      // Slot → slot swap (same player only)
      const sourceSlotId = activeStr.slice(5);
      if (sourceSlotId === targetSlotId) return;
      const sourcePlayerId = slotToPlayer.get(sourceSlotId);
      if (sourcePlayerId === targetPlayerId) {
        swapSlots(sourceSlotId, targetSlotId);
      }
    }
  }

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-slate-500 text-sm">
          {connected ? "Loading session..." : "Connecting..."}
        </div>
      </div>
    );
  }

  const gen = GENERATIONS.find((g) => g.id === session.generation);

  const totalCaught = session.box.reduce(
    (acc, l) => acc + l.entries.length,
    0
  );
  const totalDead = session.box.reduce(
    (acc, l) => acc + l.entries.filter((e) => e.is_dead).length,
    0
  );
  const aliveLinks = session.box.filter((l) => !l.is_dead).length;
  const hasTeamPokemon = session.players.some((p) =>
    p.slots.some((s) => s.pokemon && !s.pokemon.is_dead)
  );

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="min-h-screen pokeball-bg">
        <div className="max-w-5xl mx-auto px-4 py-6">
          {/* Header */}
          <div className="flex items-start justify-between mb-4 gap-4">
            <div className="flex items-center gap-3">
              <Link
                to="/"
                className="text-slate-500 hover:text-slate-300 transition-colors text-sm"
              >
                &larr;
              </Link>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl font-bold tracking-tight">
                    {session.name}
                  </h1>
                  {gen && (
                    <span className="text-[10px] text-slate-500 bg-surface-700/80 px-1.5 py-0.5 rounded">
                      {gen.name} &middot; {gen.region}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3 text-[10px] text-slate-500 mt-0.5">
                  <span>{session.players.length}/4 players</span>
                  <span>{aliveLinks} links alive</span>
                  <span>{totalCaught} caught</span>
                  {totalDead > 0 && (
                    <span className="text-red-400">{totalDead} fallen</span>
                  )}
                  <div className="flex items-center gap-1">
                    <div
                      className={`w-1.5 h-1.5 rounded-full ${
                        connected ? "bg-green-500" : "bg-red-500"
                      }`}
                    />
                    <span>{connected ? "live" : "offline"}</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {session.players.length > 0 && (
                <button
                  onClick={() => setShowEncounterModal(true)}
                  className="px-3 py-2 bg-red-600 hover:bg-red-500 rounded-lg text-xs font-semibold transition-colors"
                  title="Catch new Pokemon and add them to your box"
                >
                  + New Encounter
                </button>
              )}
              <AddPlayerForm
                onAdd={addPlayer}
                disabled={session.players.length >= 4}
              />
            </div>
          </div>

          {/* Badge Counter */}
          <div className="mb-5">
            <BadgeCounter
              generation={session.generation}
              badges={session.badges}
              onUpdateBadges={updateBadges}
            />
          </div>

          {/* Team Grid */}
          <SlotGrid
            players={session.players}
            onSlotClick={(slot) => setSelectedSlot(slot)}
            onRemovePlayer={removePlayer}
            onClearAll={clearAllSlots}
          />

          {/* Type Coverage */}
          {hasTeamPokemon && (
            <div className="mt-6">
              <TypeCoverage players={session.players} />
            </div>
          )}

          {/* Box Section */}
          {session.players.length > 0 && (
            <div className="mt-8">
              <div className="mb-3">
                <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Box ({session.box.length} links)
                </h2>
                <p className="text-[10px] text-slate-600 mt-0.5">
                  All caught Pokemon — drag them into team slots above, or click
                  to manage
                </p>
              </div>
              <BoxView
                box={session.box}
                players={session.players}
                onKillLink={killLinkGroup}
              />
            </div>
          )}

          {/* Route Overview / Encounters */}
          {session.players.length > 0 && session.box.length > 0 && (
            <div className="mt-8">
              <RouteOverview
                box={session.box}
                players={session.players}
                failedEncounters={session.failedEncounters}
                onAddEncounter={() => setShowEncounterModal(true)}
                onRemoveFailedEncounter={removeFailedEncounter}
              />
            </div>
          )}
        </div>

        {/* Slot Selector Modal */}
        {selectedSlot && (
          <PokemonSelector
            slot={selectedSlot}
            box={session.box}
            playerId={selectedSlot.player_id}
            onAssign={(boxEntryId) =>
              assignToSlot(selectedSlot.id, boxEntryId)
            }
            onClear={() => clearSlot(selectedSlot.id)}
            onKillLink={killLinkGroup}
            onClose={() => setSelectedSlot(null)}
          />
        )}

        {/* Add Encounter Modal */}
        {showEncounterModal && (
          <AddEncounterModal
            players={session.players}
            box={session.box}
            failedEncounters={session.failedEncounters}
            onAdd={addToBox}
            onAddFailed={addFailedEncounter}
            onClose={() => setShowEncounterModal(false)}
          />
        )}
      </div>

      {/* Drag Overlay — floating pokemon card */}
      <DragOverlay>
        {dragPokemon ? (
          <div className="bg-surface-700 rounded-lg px-3 py-2 border border-surface-500 shadow-2xl flex items-center gap-2">
            <img
              src={`${SPRITE_URL}${dragPokemon.pokemon_id}.png`}
              alt={dragPokemon.pokemon_name}
              className="w-8 h-8 object-contain"
            />
            <div>
              <div className="text-xs font-medium capitalize">
                {dragPokemon.nickname || dragPokemon.pokemon_name}
              </div>
              {dragPokemon.pokemon_types && (
                <div className="flex gap-0.5">
                  {dragPokemon.pokemon_types.split(",").map((t) => (
                    <span
                      key={t}
                      className="text-[7px] font-bold uppercase px-1 py-[0.5px] rounded-sm text-white/80"
                      style={{ backgroundColor: TYPE_COLORS[t] || "#888" }}
                    >
                      {t.slice(0, 3)}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
