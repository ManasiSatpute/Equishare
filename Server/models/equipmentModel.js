import db from "../config/db.js";

export const getAllEquipment = () => {
  const query = "SELECT * FROM equipment";
  return new Promise((resolve, reject) => {
    db.query(query, (err, result) => {
      if (err) return reject(err);
      resolve(result);
    });
  });
};

export const getEquipmentById = (id) => {
  return new Promise((resolve, reject) => {
    db.query("SELECT * FROM equipment WHERE id = ?", [id], (err, results) => {
      if (err) return reject(err);
      resolve(results[0]); 
    });
  });
};


export const createEquipment = (equipment) => {
  const query = `
    INSERT INTO equipment 
    (owner_id, name, category, description, price,quantity, location, image_url, engine_power, fuel_type, year, equipment_condition)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,?)`;

  const values = [
    equipment.owner_id,
    equipment.name,
    equipment.category,
    equipment.description,
    equipment.price,
    equipment.quantity,
    equipment.location,
    equipment.image_url,
    equipment.enginePower,
    equipment.fuelType,
    equipment.year,
    equipment.condition,
  ];

  return new Promise((resolve, reject) => {
    db.query(query, values, (err, result) => {
      if (err) return reject(err);
      resolve(result.insertId);
    });
  });
};

export const deleteEquipment = (id) => {
  const query = "DELETE FROM equipment WHERE id = ?";
  return new Promise((resolve, reject) => {
    db.query(query, [id], (err, result) => {
      if (err) return reject(err);
      resolve(result);
    });
  });
};

export const updateEquipment = (id, equipment) => {
  // Build query dynamically based on provided fields
  let query = "UPDATE equipment SET ";
  const params = [];
  
  if (equipment.name !== undefined) { query += "name = ?, "; params.push(equipment.name); }
  if (equipment.category !== undefined) { query += "category = ?, "; params.push(equipment.category); }
  if (equipment.description !== undefined) { query += "description = ?, "; params.push(equipment.description); }
  if (equipment.price !== undefined) { query += "price = ?, "; params.push(equipment.price); }
  if (equipment.quantity !== undefined) { query += "quantity = ?, "; params.push(equipment.quantity); }
  if (equipment.location !== undefined) { query += "location = ?, "; params.push(equipment.location); }
  if (equipment.image_url !== undefined) { query += "image_url = ?, "; params.push(equipment.image_url); }
  
  // Remove trailing comma and space
  query = query.slice(0, -2);
  query += " WHERE id = ?";
  params.push(id);

  return new Promise((resolve, reject) => {
    if (params.length === 1) return resolve({ affectedRows: 0 }); // Nothing to update
    db.query(query, params, (err, result) => {
      if (err) return reject(err);
      resolve(result);
    });
  });
};

export const getEquipmentByOwner = (ownerId) => {
  const query = "SELECT * FROM equipment WHERE owner_id = ?";
  return new Promise((resolve, reject) => {
    db.query(query, [ownerId], (err, result) => {
      if (err) return reject(err);
      resolve(result);
    });
  });
};
