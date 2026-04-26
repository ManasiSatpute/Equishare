import db from "../config/db.js";

// ✅ Add item to cart
export const addToCart = async (userId, equipmentId, days) => {
  const query = `INSERT INTO cart (user_id, equipment_id, days) VALUES (?, ?, ?)`;
  const [result] = await db.promise().query(query, [userId, equipmentId, days]);
  return result;
};

// ✅ Get all items in cart for one user
export const getCartItems = async (userId) => {
  const query = `
    SELECT 
      c.id AS id,
      e.id AS equipment_id,
      e.name,
      e.price,
      e.image_url,
      c.days
    FROM cart c
    JOIN equipment e ON c.equipment_id = e.id
    WHERE c.user_id = ?
  `;
  const [rows] = await db.promise().query(query, [userId]);
  return rows;
};

// ✅ Remove single item
export const removeFromCart = async (cartId) => {
  const query = `DELETE FROM cart WHERE id = ?`;
  const [result] = await db.promise().query(query, [cartId]);
  return result;
};

// ✅ Clear all cart items
export const clearCart = async (userId) => {
  const query = `DELETE FROM cart WHERE user_id = ?`;
  const [result] = await db.promise().query(query, [userId]);
  return result;
};

// ✅ Update rental days
export const updateCartDays = async (cartId, days) => {
  const query = `UPDATE cart SET days = ? WHERE id = ?`;
  const [result] = await db.promise().query(query, [days, cartId]);
  return result;
};

// ✅ Confirm payment and order
export const confirmPayment = async (userId, totalAmount, address, startDate, endDate) => {
  const query = `INSERT INTO orders (user_id, total_amount, address, start_date, end_date) VALUES (?, ?, ?, ?, ?)`;
  const [result] = await db.promise().query(query, [userId, totalAmount, address, startDate, endDate]);
  return result;
};
