// import {
//   getWishlistItems,
//   addToWishlist as addToWishlistModel,
//   removeFromWishlist as removeFromWishlistModel
// } from "../models/wishlistModel.js";

// // ✅ Get user's wishlist
// export const getWishlist = async (req, res) => {
//   try {
//     const userId = req.user.id;
//     const wishlist = await getWishlistItems(userId);
//     res.json(wishlist);
//   } catch (err) {
//     res.status(500).json({ message: "Error fetching wishlist", error: err });
//   }
// };

// // ✅ Add item to wishlist
// export const addWishlist = async (req, res) => {
//   try {
//     const { equipmentId } = req.body;
//     const userId = req.user.id;

//     // Optional: prevent duplicate items
//     const existing = await getWishlistItems(userId);
//     const alreadyExists = existing.some(item => item.id === equipmentId);
//     if (alreadyExists) return res.status(400).json({ message: "Item already in wishlist" });

//     const newId = await addToWishlistModel(userId, equipmentId);
//     res.status(201).json({ message: "Item added to wishlist", id: newId });
//   } catch (err) {
//     res.status(500).json({ message: "Error adding to wishlist", error: err });
//   }
// };

// // ✅ Remove item from wishlist
// export const removeWishlist = async (req, res) => {
//   try {
//     const userId = req.user.id;
//     const equipmentId = req.params.id;
//     await removeFromWishlistModel(userId, equipmentId);
//     res.json({ message: "Item removed from wishlist" });
//   } catch (err) {
//     res.status(500).json({ message: "Error removing from wishlist", error: err });
//   }
// };
import {
  getWishlistItems,
  addToWishlist as addToWishlistModel,
  removeFromWishlist as removeFromWishlistModel
} from "../models/wishlistModel.js";

// ✅ Get user's wishlist
export const getWishlist = async (req, res) => {
  try {
    const userId = req.user.id;
    const wishlist = await getWishlistItems(userId);
    res.json(wishlist);
  } catch (err) {
    console.error("❌ Error fetching wishlist:", err);
    res.status(500).json({ message: "Error fetching wishlist" });
  }
};

// ✅ Add item to wishlist
export const addWishlist = async (req, res) => {
  try {
    const { equipmentId } = req.body;
    const userId = req.user.id;

    // prevent duplicates (compare with equipment_id)
    const existing = await getWishlistItems(userId);
    const alreadyExists = existing.some(item => item.equipment_id === Number(equipmentId));
    if (alreadyExists) return res.status(400).json({ message: "Item already in wishlist" });

    const newId = await addToWishlistModel(userId, equipmentId);
    res.status(201).json({ message: "Item added to wishlist", id: newId });
  } catch (err) {
    console.error("❌ Error adding to wishlist:", err);
    res.status(500).json({ message: "Error adding to wishlist" });
  }
};

// ✅ Remove item from wishlist
export const removeWishlist = async (req, res) => {
  try {
    const userId = req.user.id;
    const equipmentId = req.params.id;
    await removeFromWishlistModel(userId, equipmentId);
    res.json({ message: "Item removed from wishlist" });
  } catch (err) {
    console.error("❌ Error removing from wishlist:", err);
    res.status(500).json({ message: "Error removing from wishlist" });
  }
};
