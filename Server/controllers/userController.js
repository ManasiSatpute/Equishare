import { getUserById, updateUserProfile } from "../models/userModel.js";
import bcrypt from "bcryptjs";
import db from "../config/db.js";


// Get Profile
export const getProfile = (req, res) => {
  getUserById(req.user.id, (err, user) => {
    if (err) {
      console.error("❌ Error fetching user:", err);
      return res.status(500).json({ message: "Database error" });
    }
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    delete user.password;
    res.json(user);
  });
};

// Update Profile
export const updateProfile = (req, res) => {
  const data = {
    first_name: req.body.first_name,
    last_name: req.body.last_name,
    phone: req.body.phone,
    alternate_phone: req.body.alternate_phone,
    street_address: req.body.street_address,
    city: req.body.city,
    state: req.body.state,
    pincode: req.body.pincode,
  };

  updateUserProfile(req.user.id, data, (err, result) => {
    if (err) {
      console.error("❌ Error updating profile:", err);
      return res.status(500).json({ message: "Error updating profile" });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({ message: "Profile updated successfully" });
  });
};
const uploadProfileImage = async (req, res) => {
  try {
    const userId = req.user.id;
    const filePath = `uploads/profile_images/${req.file.filename}`;

    await User.update(
      { profileImage: filePath },
      { where: { id: userId } }
    );

    res.json({ success: true, path: filePath });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error uploading image" });
  }
};
// import db from "../config/db.js"; // adjust if your DB connection file is different

// ✅ update only address fields
// ✅ Update only address fields
export const updateUserAddress = async (req, res) => {
  try {
    const userId = req.user.id;
    const { street_address, city, state, pincode } = req.body;

    const [result] = await db.promise().query(
      "UPDATE users SET street_address = ?, city = ?, state = ?, pincode = ? WHERE id = ?",
      [
        street_address !== undefined ? street_address : null, 
        city !== undefined ? city : null, 
        state !== undefined ? state : null, 
        pincode !== undefined ? pincode : null, 
        userId
      ]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({ message: "Address updated successfully!" });
  } catch (err) {
    console.error("Error updating address FULL TRACE:", err);
    res.status(500).json({ message: "Server error while updating address", error: err.message });
  }
};


// ✅ Change Password
export const changePassword = (req, res) => {
  const userId = req.user.id;
  const { currentPassword, newPassword } = req.body || {};
  if (!currentPassword || !newPassword) {
    return res.status(400).json({ message: "currentPassword and newPassword are required" });
  }

  db.query("SELECT password FROM users WHERE id = ?", [userId], (err, rows) => {
    if (err) return res.status(500).json({ message: "Database error" });
    if (!rows.length) return res.status(404).json({ message: "User not found" });
    const hash = rows[0].password;
    bcrypt.compare(currentPassword, hash, (err, match) => {
      if (err) return res.status(500).json({ message: "Compare error" });
      if (!match) return res.status(400).json({ message: "Current password is incorrect" });
      bcrypt.hash(newPassword, 10, (err, newHash) => {
        if (err) return res.status(500).json({ message: "Hash error" });
        db.query("UPDATE users SET password = ? WHERE id = ?", [newHash, userId], (err2) => {
          if (err2) return res.status(500).json({ message: "Failed to update password" });
          res.json({ message: "Password updated successfully" });
        });
      });
    });
  });
};

// ✅ Delete Account (and clean simple related data)
export const deleteAccount = async (req, res) => {
  try {
    const userId = req.user.id;
    await db.promise().query("DELETE FROM cart WHERE user_id = ?", [userId]);
    await db.promise().query("DELETE FROM wishlist WHERE user_id = ?", [userId]);
    await db.promise().query("DELETE FROM rentals WHERE user_id = ?", [userId]);
    await db.promise().query("DELETE FROM users WHERE id = ?", [userId]);
    res.json({ message: "Account deleted" });
  } catch (e) {
    console.error("Delete account error:", e);
    res.status(500).json({ message: "Failed to delete account" });
  }
};
