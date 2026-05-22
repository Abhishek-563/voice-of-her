import express from "express";

import {
  sendSOS,
  getSOSHistory,
  updateSOSStatus,
  updateSOSEvidence,
  deleteSOSAlert,
  clearAllSOS,
  deleteResolvedSOS,
} from "../controllers/sosController.js";

import { protect } from "../middleware/authMiddleware.js";
import { adminOnly } from "../middleware/adminMiddleware.js";

const router = express.Router();

router.post("/send", protect, sendSOS);

router.get("/history", protect, adminOnly, getSOSHistory);

router.patch("/:id/status", protect, adminOnly, updateSOSStatus);

router.patch("/:id/evidence", protect, updateSOSEvidence);

router.delete("/clear-all", protect, adminOnly, clearAllSOS);

router.delete("/resolved", protect, adminOnly, deleteResolvedSOS);

router.delete("/:id", protect, adminOnly, deleteSOSAlert);

export default router;
