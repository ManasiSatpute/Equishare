import express from "express";
import { protect } from "../middleware/authMiddleware.js"; // keep this as per your setup
import {
  checkoutRental,
  returnRental,
  markDamaged,
  getUserHistory,
  getOwnerHistory,
  updateDeliveryStatus,
  getDashboardData,
  verifyDeliveryOTP
} from "../controllers/rentalController.js";

const router = express.Router();

// Checkout: create rental order from cart
router.post("/checkout", protect, checkoutRental);

// Return a rented item
router.put("/return/:id", protect, returnRental);

router.post("/verify-otp", protect, verifyDeliveryOTP);
// Mark item as damaged
router.put("/damage/:id", protect, markDamaged);

//  Update delivery status (owner)
router.put("/delivery-status/:deliveryId", protect, updateDeliveryStatus);

// User history (active, past, and deleted records)
router.get("/history", protect, getUserHistory);

//Owner dashboard data including active deliveries
router.get("/dashboard", protect, getDashboardData);

//  Owner history (deleted equipment + archived rentals)
router.get("/owner-history", protect, getOwnerHistory);

export default router;
