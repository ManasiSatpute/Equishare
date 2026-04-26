// import mysql from "mysql2";
// import dotenv from "dotenv";

// dotenv.config();

// const db = mysql.createPool({
//   host: process.env.DB_HOST || 'localhost',
//   user: process.env.DB_USER || 'root',
//   password: process.env.DB_PASS || '',
//   database: process.env.DB_NAME || 'kiraya',
//   waitForConnections: true,
//   connectionLimit: 10,
//   queueLimit: 0

// });

// // Handle connection errors
// db.connect((err) => {
//   if (err) {
//     console.error("❌ Database connection failed:", err.message);
//     console.error("Connection config:", {
//       host: process.env.DB_HOST || 'localhost',
//       user: process.env.DB_USER || 'root',
//       database: process.env.DB_NAME || 'kiraya'
//     });
//   } else {
//     console.log("✅ Connected to MySQL Database");
//   }
// });

// // Handle runtime errors
// db.on('error', (err) => {
//   console.error('Database error:', err);
//   if (err.code === 'PROTOCOL_CONNECTION_LOST') {
//     console.log('Attempting to reconnect to database...');
//     db.connect();
//   } else {
//     throw err;
//   }
// });

// export default db;
import mysql from "mysql2";
import dotenv from "dotenv";

dotenv.config();

// ✅ Use connection pool instead of single connection
const db = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASS || '',
  database: process.env.DB_NAME || 'kiraya',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Handle connection test once (optional)
db.getConnection((err, connection) => {
  if (err) {
    console.error("❌ Database connection failed:", err.message);
    console.error("Connection config:", {
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      database: process.env.DB_NAME || 'kiraya'
    });
  } else {
    console.log("✅ Connected to MySQL Database");
    connection.release(); // release test connection
  }
});

// Handle runtime errors
db.on('error', (err) => {
  console.error('Database error:', err);
  if (err.code === 'PROTOCOL_CONNECTION_LOST') {
    console.log('Attempting to reconnect to database...');
  } else {
    throw err;
  }
});

export default db;
