import db from "../config/db.js";

// ✅ Fetch wishlist items for a specific user
export const getWishlistItems = (userId) => {
  const query = `
    SELECT w.id, w.equipment_id, e.name, e.image_url, e.price 
    FROM wishlist w 
    JOIN equipment e ON w.equipment_id = e.id 
    WHERE w.user_id = ?`;
  return new Promise((resolve, reject) => {
    db.query(query, [userId], (err, result) => {
      if (err) return reject(err);
      resolve(result);
    });
  });
};

// ✅ Add item to wishlist
export const addToWishlist = (userId, equipmentId) => {
  const query = `INSERT INTO wishlist (user_id, equipment_id) VALUES (?, ?)`;
  return new Promise((resolve, reject) => {
    db.query(query, [userId, equipmentId], (err, result) => {
      if (err) return reject(err);
      resolve(result.insertId);
    });
  });
};

// ✅ Remove item from wishlist
export const removeFromWishlist = (userId, equipmentId) => {
  const query = `DELETE FROM wishlist WHERE user_id = ? AND equipment_id = ?`;
  return new Promise((resolve, reject) => {
    db.query(query, [userId, equipmentId], (err, result) => {
      if (err) return reject(err);
      resolve(result);
    });
  });
};


