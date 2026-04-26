import {
  getAllEquipment as getAllEquipmentModel,
  getEquipmentById as getEquipmentByIdModel,
  createEquipment as createEquipmentModel,
  deleteEquipment as deleteEquipmentModel,
  updateEquipment as updateEquipmentModel,
  getEquipmentByOwner as getEquipmentByOwnerModel
} from "../models/equipmentModel.js";
// ✅ Get equipment by ID
export const getEquipmentById = async (req, res) => {
  try {
    const item = await getEquipmentByIdModel(req.params.id);
    if (!item) return res.status(404).json({ message: "Equipment not found" });
    res.json(item);
  } catch (err) {
    res.status(500).json({ message: "Error fetching equipment", error: err });
  }
};

// ✅ Create equipment (for MySQL backend)
export const createEquipment = async (req, res) => {
  try {
    const {
      name,
      description,
      price,
      category,
      location,
      enginePower,
      fuelType,
      year,
      condition
    } = req.body;

    const owner_id = req.user?.id || req.user?._id || 1; // fallback for testing
    const image_url = req.file ? `/uploads/${req.file.filename}` : null;

    const newEquipment = {
      owner_id,
      name,
      category,
      description,
      price,
      location,
      image_url,
      enginePower,
      fuelType,
      year,
      condition,
    };

    const insertId = await createEquipmentModel(newEquipment);

    res.status(201).json({
      success: true,
      message: "Equipment created successfully",
      data: { id: insertId, ...newEquipment },
    });
  } catch (error) {
    console.error("❌ Error creating equipment:", error);
    res.status(500).json({
      success: false,
      message: "Server error while creating equipment",
      error: error.message,
    });
  }
};
// ✅ Get all equipment
export const getAllEquipment = async (req, res) => {
  try {
    const equipment = await getAllEquipmentModel();
    res.json(equipment);
  } catch (err) {
    res.status(500).json({ message: "Error fetching equipment", error: err });
  }
};


// ✅ Delete equipment
export const deleteEquipment = async (req, res) => {
  try {
    const id = req.params.id;
    console.log("🗑️ Deleting equipment with ID:", id);

    const result = await deleteEquipmentModel(id);
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Equipment not found" });
    }

    res.json({ message: "Equipment deleted successfully" });
  } catch (err) {
    console.error("❌ Error deleting equipment:", err.message);
    res.status(500).json({ message: "Error deleting equipment", error: err });
  }
};

// ✅ Update equipment
export const updateEquipment = async (req, res) => {
  try {
    const id = req.params.id;
    const { name, category, price, location, description } = req.body;
    let image_url = req.file ? `/uploads/${req.file.filename}` : undefined;

    const dataToUpdate = { name, category, price, location, description };
    if (image_url) {
      dataToUpdate.image_url = image_url;
    }

    // Clean undefined values
    Object.keys(dataToUpdate).forEach(key => dataToUpdate[key] === undefined && delete dataToUpdate[key]);

    const result = await updateEquipmentModel(id, dataToUpdate);

    // Ignore affectedRows === 0 check, as it throws false negatives when submitting identical data

    res.json({ success: true, message: "Equipment updated successfully", data: { id, ...dataToUpdate } });
  } catch (err) {
    console.error("❌ Error updating equipment:", err.message);
    res.status(500).json({ message: "Server error while updating equipment", error: err.message });
  }
};

// ✅ Owner-only: get my equipment
export const getMyEquipment = async (req, res) => {
  try {
    const ownerId = req.user?.id;
    if (!ownerId) return res.status(401).json({ message: "Unauthorized" });
    const equipment = await getEquipmentByOwnerModel(ownerId);
    res.json(equipment);
  } catch (err) {
    res.status(500).json({ message: "Error fetching my equipment", error: err });
  }
};
