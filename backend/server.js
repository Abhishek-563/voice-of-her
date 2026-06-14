import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import http from "http";

import { Server } from "socket.io";

import sosRoutes from "./routes/sosRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import contactRoutes from "./routes/contactRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import pushRoutes from "./routes/pushRoutes.js";
import connectDB from "./config/db.js";
import webpush from "web-push";
import { startNotificationRetryLoop } from "./services/notificationRetryService.js";

dotenv.config();

connectDB();

const app = express();

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*",
  },
});

app.use(cors());

app.use(express.json());

app.set("io", io);

// Configure web-push VAPID details
if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(
    `mailto:${process.env.EMAIL_USER || "admin@voiceofher.com"}`,
    process.env.VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  );
  console.log("VAPID details configured successfully.");
} else {
  console.warn("VAPID keys not configured. Web Push notifications will be disabled.");
}

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/sos", sosRoutes);
app.use("/api/contacts", contactRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/push", pushRoutes);

// Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date() });
});

io.on("connection", (socket) => {
  console.log("User Connected:", socket.id);

  socket.on("disconnect", () => {
    console.log("User Disconnected:", socket.id);
  });
});

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  startNotificationRetryLoop(io);
});
