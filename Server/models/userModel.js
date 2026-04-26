import db from "../config/db.js"; // this should be your MySQL connection file

// Get user by ID
export const getUserById = (id, callback) => {
  const sql = "SELECT * FROM users WHERE id = ?";
  db.query(sql, [id], (err, results) => {
    if (err) return callback(err);
    callback(null, results[0]);
  });
};

// Update user profile
export const updateUserProfile = (id, data, callback) => {
  const sql = `
    UPDATE users 
    SET first_name = ?, 
        last_name = ?, 
        phone = ?, 
        alternate_phone = ?, 
        street_address = ?, 
        city = ?, 
        state = ?, 
        pincode = ?
    WHERE id = ?
  `;

  const values = [
    data.first_name,
    data.last_name,
    data.phone,
    data.alternate_phone,
    data.street_address,
    data.city,
    data.state,
    data.pincode,
    id,
  ];

  db.query(sql, values, (err, result) => {
    if (err) return callback(err);
    callback(null, result);
  });
};
