import db from "../config/db.js";

export const createRental = (rental) => {
  const query = `
    INSERT INTO rentals (user_id, equipment_id, owner_id, days, total_amount, payment_status)
    VALUES (?, ?, ?, ?, ?, 'pending')`;
  const values = [
    rental.user_id,
    rental.equipment_id,
    rental.owner_id,
    rental.days,
    rental.total_amount,
  ];

  return new Promise((resolve, reject) => {
    db.query(query, values, (err, result) => {
      if (err) return reject(err);
      resolve(result.insertId);
    });
  });
};

export const updatePaymentStatus = (orderId, status) => {
  const query = `UPDATE rentals SET payment_status = ? WHERE id = ?`;
  return new Promise((resolve, reject) => {
    db.query(query, [status, orderId], (err, result) => {
      if (err) return reject(err);
      resolve(result);
    });
  });
};
