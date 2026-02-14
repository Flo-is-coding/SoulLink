import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import cors from "cors";
import { initDb } from "./db";
import sessionRoutes from "./routes/sessions";
import { registerSessionHandler } from "./socket/sessionHandler";

const app = express();
const httpServer = createServer(app);
const corsOrigin = process.env.CORS_ORIGIN || "http://localhost:5173";
const io = new Server(httpServer, {
  cors: { origin: corsOrigin },
});

app.use(cors({ origin: corsOrigin }));
app.use(express.json());

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.use("/api/sessions", sessionRoutes);

io.on("connection", (socket) => {
  console.log("Client connected:", socket.id);
  registerSessionHandler(io, socket);
  socket.on("disconnect", () => {
    console.log("Client disconnected:", socket.id);
  });
});

const PORT = Number(process.env.PORT) || 3001;

async function start() {
  await initDb();
  httpServer.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

start().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});

export { io };
