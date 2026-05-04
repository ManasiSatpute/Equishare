import {
  getAllEquipment as getAllEquipmentModel,
  getEquipmentById as getEquipmentByIdModel,
  createEquipment as createEquipmentModel,
  deleteEquipment as deleteEquipmentModel,
  updateEquipment as updateEquipmentModel,
  getEquipmentByOwner as getEquipmentByOwnerModel
} from "../models/equipmentModel.js";
//  Get equipment by ID
export const getEquipmentById = async (req, res) => {
  try {
    const item = await getEquipmentByIdModel(req.params.id);
    if (!item) return res.status(404).json({ message: "Equipment not found" });
    res.json(item);
  } catch (err) {
    res.status(500).json({ message: "Error fetching equipment", error: err });
  }
};

//  Create equipment (for MySQL backend)
export const createEquipment = async (req, res) => {
  try {
    const {
      name,
      description,
      price,
      quantity,
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
      quantity,
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
//  Get all equipment
export const getAllEquipment = async (req, res) => {
  try {
    const equipment = await getAllEquipmentModel();
    res.json(equipment);
  } catch (err) {
    res.status(500).json({ message: "Error fetching equipment", error: err });
  }
};



export const deleteEquipment = async (req, res) => {
  try {
    const id = req.params.id;

    //  Check equipment exists
    const existing = await getEquipmentByIdModel(id);
    if (!existing) {
      return res.status(404).json({ message: "Equipment not found" });
    }

    //  Check ownership — only the owner can delete their own equipment
    if (existing.owner_id !== req.user.id) {
      return res.status(403).json({ message: "You can only delete your own equipment" });
    }

    await deleteEquipmentModel(id);
    res.json({ success: true, message: "Equipment deleted successfully" });

  } catch (err) {
    console.error("❌ Error deleting equipment:", err.message);
    res.status(500).json({ message: "Error deleting equipment", error: err.message });
  }
};

//  Update equipment
export const updateEquipment = async (req, res) => {
  try {
    const id = req.params.id;

    //  Ownership check — fetch equipment first
    const existing = await getEquipmentByIdModel(id);
    if (!existing) return res.status(404).json({ message: "Equipment not found" });

    if (existing.owner_id !== req.user.id) {
      return res.status(403).json({ message: "You can only edit your own equipment" });
    }

    //  quantity added
    const { name, category, price, quantity, location, description } = req.body;
    const image_url = req.file ? `/uploads/${req.file.filename}` : undefined;

    const dataToUpdate = { name, category, price, quantity, location, description };
    if (image_url) dataToUpdate.image_url = image_url;

    // Remove undefined values
    Object.keys(dataToUpdate).forEach(
      (key) => dataToUpdate[key] === undefined && delete dataToUpdate[key]
    );

    await updateEquipmentModel(id, dataToUpdate);

    res.json({
      success: true,
      message: "Equipment updated successfully",
      data: { id, ...dataToUpdate },
    });
  } catch (err) {
    console.error("❌ Error updating equipment:", err.message);
    res.status(500).json({ message: "Server error while updating equipment", error: err.message });
  }
};
//  Owner-only: get my equipment
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
