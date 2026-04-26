import express from "express";
import {
  getCart,
  addToCart,
  removeFromCart,
  clearCart
} from "../controllers/cartController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// Ensure all cart endpoints require authentication
router.use(protect);

// Debug logger
router.use((req, _res, next) => {
  console.log(`[cartRoutes] ${req.method} ${req.originalUrl} body:`, req.body);
  next();
});

// Routes
router.get("/", getCart); // GET /api/cart
router.post("/add", addToCart); // POST /api/cart/add
router.delete("/remove/:id", removeFromCart); // DELETE /api/cart/remove/:id
router.delete("/clear", clearCart); // DELETE /api/cart/clear

export default router;
