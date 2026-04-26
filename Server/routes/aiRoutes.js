import express from "express";
import { askAssistant } from "../controllers/aiController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// Basic AI endpoint; require auth to avoid public abuse
router.post("/ask", protect, askAssistant);

export default router;


