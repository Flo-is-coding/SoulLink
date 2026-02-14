import { Router } from "express";
import {
  createSession,
  getSession,
  listSessions,
  deleteSession,
} from "../repositories/sessionRepository";

const router = Router();

router.get("/", async (_req, res) => {
  const sessions = await listSessions();
  res.json(sessions);
});

router.post("/", async (req, res) => {
  const { name, generation } = req.body;
  if (!name || typeof name !== "string" || !name.trim()) {
    res.status(400).json({ error: "Name is required" });
    return;
  }
  const gen = typeof generation === "number" ? generation : 1;
  const session = await createSession(name.trim(), gen);
  res.status(201).json(session);
});

router.get("/:id", async (req, res) => {
  const session = await getSession(req.params.id);
  if (!session) {
    res.status(404).json({ error: "Session not found" });
    return;
  }
  res.json(session);
});

router.delete("/:id", async (req, res) => {
  const deleted = await deleteSession(req.params.id);
  if (!deleted) {
    res.status(404).json({ error: "Session not found" });
    return;
  }
  res.status(204).send();
});

export default router;
