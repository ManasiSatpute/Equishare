
import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import {
  getProfile,
  updateProfile,
  changePassword,
  deleteAccount,
  updateUserAddress
} from "../controllers/userController.js";
import { protect } from "../middleware/authMiddleware.js";
import db from "../config/db.js";

const router = express.Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const uploadDir = path.join(__dirname, "../uploads/profile_images");
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${req.user.id}-${Date.now()}${ext}`);
  },
});
const upload = multer({ storage });

router.get("/profile", protect, getProfile);
router.put("/profile", protect, updateProfile);

router.post("/profile/upload", protect, upload.single("profileImage"), (req, res) => {
  if (!req.file) return res.status(400).json({ message: "No file uploaded" });
  const imagePath = `profile_images/${req.file.filename}`;
  const sql = "UPDATE users SET profile_image = ? WHERE id = ?";
  db.query(sql, [imagePath, req.user.id], (err) => {
    if (err) return res.status(500).json({ message: "Error saving image" });
    res.json({
      message: "Profile image updated successfully",
      imagePath: `/uploads/${imagePath}`,
    });
  });
});

router.post("/change-password", protect, changePassword);
router.put("/profile/address", protect, updateUserAddress);

router.delete("/account", protect, deleteAccount);

export default router;
