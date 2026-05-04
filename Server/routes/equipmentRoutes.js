import express from "express";
import multer from "multer";
import {
  getAllEquipment,
  getEquipmentById,
  createEquipment,
  updateEquipment,
  deleteEquipment,
  getMyEquipment
} from "../controllers/equipmentController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

//  Configure multer storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"),
  filename: (req, file, cb) =>
    cb(null, Date.now() + "-" + file.originalname.replace(/\s+/g, "_")),
});

const upload = multer({ storage });

//  Routes
router.get("/", getAllEquipment);
router.get("/mine", protect, getMyEquipment);
router.get("/:id", getEquipmentById);
router.post("/", protect, upload.single("image"), createEquipment);
router.put("/:id", protect,  upload.single("image"), updateEquipment);
router.delete("/:id", protect, deleteEquipment);

export default router;
