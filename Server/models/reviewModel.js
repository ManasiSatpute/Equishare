import db from "../config/db.js";

export const createReview = (review, callback) => {
  const { userId, equipmentId, rating, comment } = review;
  const sql = `
    INSERT INTO reviews (userId, equipmentId, rating, comment)
    VALUES (?, ?, ?, ?)
  `;
  db.query(sql, [userId, equipmentId, rating, comment], callback);
};

export const getReviewsByEquipment = (equipmentId, callback) => {
  db.query("SELECT * FROM reviews WHERE equipmentId = ?", [equipmentId], callback);
};
