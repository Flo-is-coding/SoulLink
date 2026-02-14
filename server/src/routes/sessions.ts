import { Router } from "express";
import {
  createSession,
  getSession,
  listSessions,
  deleteSession,
} from "../repositories/sessionRepository";

const router = Router();

router.get("/", (_req, res) => {
  res.json(listSessions());
});

router.post("/", (req, res) => {
  const { name, generation } = req.body;
  if (!name || typeof name !== "string" || !name.trim()) {
    res.status(400).json({ error: "Name is required" });
    return;
  }
  const gen = typeof generation === "number" ? generation : 1;
  const session = createSession(name.trim(), gen);
  res.status(201).json(session);
});

router.get("/:id", (req, res) => {
  const session = getSession(req.params.id);
  if (!session) {
    res.status(404).json({ error: "Session not found" });
    return;
  }
  res.json(session);
});

router.delete("/:id", (req, res) => {
  const deleted = deleteSession(req.params.id);
  if (!deleted) {
    res.status(404).json({ error: "Session not found" });
    return;
  }
  res.status(204).send();
});

export default router;
