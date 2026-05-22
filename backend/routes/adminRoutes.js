import express from "express";
import {
  getAllUsers,
  updateUserRole,
} from "../controllers/adminController.js";

import { protect } from "../middleware/authMiddleware.js";
import { adminOnly } from "../middleware/adminMiddleware.js";

const router = express.Router();

router.get("/users", protect, adminOnly, getAllUsers);

router.patch("/users/:id/role", protect, adminOnly, updateUserRole);

export default router;
