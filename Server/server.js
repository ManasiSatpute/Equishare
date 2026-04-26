import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import db from "./config/db.js";

import authRoutes from "./routes/authRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import equipmentRoutes from "./routes/equipmentRoutes.js";
import cartRoutes from "./routes/cartRoutes.js";
import wishlistRoutes from "./routes/wishlistRoutes.js";
import rentalRoutes from "./routes/rentalRoutes.js";
import aiRoutes from "./routes/aiRoutes.js";

import path from "path";
import { fileURLToPath } from "url";
import { initCronJobs } from "./jobs/cronJobs.js";

//  Load environment variables
dotenv.config();

const app = express();

//  Basic middlewares
app.use(cors()); // handles all CORS (OPTIONS automatically handled in Express 5)
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

//  __dirname fix for ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

//  Test MySQL connection
db.query("SELECT 1", (err) => {
  if (err) console.error("❌ DB Connection Failed:", err.message);
  else console.log(" MySQL Connected");
});

//  Register routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/equipment", equipmentRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/wishlist", wishlistRoutes);
app.use("/api/rentals", rentalRoutes);
app.use("/api/ai", aiRoutes);

//  Static uploads (for images)
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

//  Health check route
app.get("/api/health", (req, res) => {
  res.json({ ok: true, uptime: process.uptime(), message: "Server is healthy ✅" });
});

//  404 handler (for undefined API routes)
app.use((req, res) => {
  res.status(404).json({ message: "API route not found" });
});


app.use((err, req, res, next) => {
  console.error("Global Error:", err.message);
  res.status(500).json({ message: "Internal Server Error" });
});


const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  initCronJobs();
});
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
