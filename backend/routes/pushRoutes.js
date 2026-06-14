import express from "express";
import { subscribe, unsubscribe, registerFcmToken } from "../controllers/pushController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/subscribe", protect, subscribe);
router.post("/unsubscribe", protect, unsubscribe);
router.post("/register-fcm", protect, registerFcmToken);

export default router;
