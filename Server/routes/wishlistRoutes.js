import express from "express";
import { addWishlist, removeWishlist, getWishlist } from "../controllers/wishlistController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/", protect, getWishlist);
router.post("/add", protect, addWishlist);
router.delete("/remove/:id", protect, removeWishlist);

export default router;

// End of backend/backend/routes/wishlistRoutes.js