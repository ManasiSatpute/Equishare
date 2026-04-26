import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import db from "../config/db.js";
import sendEmail from "../utils/email.js";

export const signup = (req, res) => {
  const { email, password, role } = req.body;

  db.query("SELECT * FROM users WHERE email = ?", [email], (err, existing) => {
    if (err) return res.status(500).json({ message: err.message });
    if (existing.length)
      return res.status(400).json({ message: "User already exists" });

    bcrypt.hash(password, 10, (err, hashed) => {
      if (err) return res.status(500).json({ message: err.message });

      db.query(
        "INSERT INTO users (email, password, role) VALUES (?, ?, ?)",
        [email, hashed, role],
        (err, result) => {
          if (err) return res.status(500).json({ message: err.message });

          const token = jwt.sign(
            { id: result.insertId, email, role },
            process.env.JWT_SECRET,
            { expiresIn: "1d" }
          );

          const verificationUrl = `http://localhost:5173/verify-email?token=${token}`;
          sendEmail({
            email,
            subject: "Verify your EquiShare Account",
            html: `<h1>Welcome to EquiShare!</h1>
                   <p>Please click the link below to verify your email address:</p>
                   <a href="${verificationUrl}">${verificationUrl}</a>`,
          });

          res.json({
            success: true,
            message: "User created successfully. Please check your email to verify your account.",
            userId: result.insertId,
            token,
          });
        }
      );
    });
  });
};
// // Inside your controller
// const targetRole = req.body.role || 'owner'; // default to owner if not specified

// const sql = `UPDATE users SET role = ?, phone = ?, city = ? WHERE id = ?`;
// db.query(sql, [targetRole, phone, city, userId], (err, result) => {
//   // ... standard response
// });
export const login = (req, res) => {
  const { email, password } = req.body;

  db.query("SELECT * FROM users WHERE email = ?", [email], (err, rows) => {
    if (err) return res.status(500).json({ message: err.message });
    if (!rows.length)
      return res.status(400).json({ message: "Invalid email or password" });

    const user = rows[0];
    
    // Optional: if (user.is_verified === 0) return res.status(403).json({message: "Please verify your email to log in"});

    bcrypt.compare(password, user.password, (err, isMatch) => {
      if (err) return res.status(500).json({ message: err.message });
      if (!isMatch)
        return res.status(400).json({ message: "Invalid email or password" });

      const token = jwt.sign(
        { id: user.id, email: user.email, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: "1d" }
      );

      let imagePath = user.profile_image;
      if (imagePath && !imagePath.startsWith("profile_images/")) {
        imagePath = `profile_images/${imagePath}`;
      }

      const imageUrl = imagePath
        ? `${req.protocol}://${req.get("host")}/uploads/${imagePath}`
        : null;

      res.json({
        success: true,
        message: "Login successful",
        token,
        user: {
          id: user.id,
          name: user.first_name || "User",
          email: user.email,
          role: user.role,
          image: imageUrl,
          isVerified: user.is_verified === 1
        },
      });
    });
  });
};


export const verifyEmail = (req, res) => {
  const { token } = req.body;
  if (!token) return res.status(400).json({ message: "Token is required" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    db.query("UPDATE users SET is_verified = 1 WHERE id = ?", [decoded.id], (err) => {
      if (err) return res.status(500).json({ message: err.message });
      res.json({ success: true, message: "Email verified successfully" });
    });
  } catch (error) {
    res.status(400).json({ message: "Invalid or expired token" });
  }
};


export const forgotPassword = (req, res) => {
  const { email } = req.body;

  db.query("SELECT * FROM users WHERE email = ?", [email], (err, rows) => {
    if (err) return res.status(500).json({ message: err.message });
    if (!rows.length) return res.status(400).json({ message: "User not found" });

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiry = new Date(Date.now() + 10 * 60 * 1000); 

    db.query(
      "UPDATE users SET otp = ?, otp_expiry = ? WHERE email = ?",
      [otp, expiry, email],
      (err) => {
        if (err) return res.status(500).json({ message: err.message });

        sendEmail({
          email,
          subject: "Password Reset OTP",
          html: `<h1>Password Reset Request</h1>
                 <p>Your OTP to reset your password is: <strong>${otp}</strong></p>
                 <p>This OTP is valid for 10 minutes.</p>`,
        });

        res.json({ success: true, message: "OTP sent to your email" });
      }
    );
  });
};


export const verifyOtp = (req, res) => {
  const { email, otp } = req.body;
  
  db.query("SELECT * FROM users WHERE email = ?", [email], (err, rows) => {
    if (err) return res.status(500).json({ message: err.message });
    if (!rows.length) return res.status(400).json({ message: "User not found" });

    const user = rows[0];
    if (user.otp !== otp) return res.status(400).json({ message: "Invalid OTP" });
    if (new Date(user.otp_expiry) < new Date()) return res.status(400).json({ message: "OTP expired" });

    res.json({ success: true, message: "OTP verified" });
  });
};


export const resetPassword = (req, res) => {
  const { email, otp, newPassword } = req.body;

  db.query("SELECT * FROM users WHERE email = ?", [email], (err, rows) => {
    if (err) return res.status(500).json({ message: err.message });
    if (!rows.length) return res.status(400).json({ message: "User not found" });

    const user = rows[0];
    if (user.otp !== otp) return res.status(400).json({ message: "Invalid OTP" });
    if (new Date(user.otp_expiry) < new Date()) return res.status(400).json({ message: "OTP expired" });

    bcrypt.hash(newPassword, 10, (err, hashed) => {
      if (err) return res.status(500).json({ message: err.message });

      db.query(
        "UPDATE users SET password = ?, otp = NULL, otp_expiry = NULL WHERE email = ?",
        [hashed, email],
        (err) => {
          if (err) return res.status(500).json({ message: err.message });
          res.json({ success: true, message: "Password reset successful" });
        }
      );
    });
  });
};


export const upgradeToOwner = (req, res) => {
  const userId = req.user.id;
  // Use targetRole from body, default to 'owner' if not provided
  const { role: targetRole, phone, city, state, street_address, pincode } = req.body;

  // 1. Validate role input
  const validRoles = ['user', 'owner'];
  const finalRole = validRoles.includes(targetRole) ? targetRole : 'owner';

  // 2. Conditional requirement: If becoming an owner, check for contact info
  if (finalRole === 'owner' && (!phone || !city)) {
    return res.status(400).json({ 
      message: "Phone and City are required to activate Owner mode." 
    });
  }

  // 3. Update the database
  // We update role AND address info in one go to keep profile synced
  const sql = `
    UPDATE users 
    SET role = ?, 
        phone = ?, 
        city = ?, 
        state = ?, 
        street_address = ?,
        pincode = ?
    WHERE id = ?
  `;

  const params = [
    finalRole, 
    phone || null, 
    city || null, 
    state || null, 
    street_address || null, 
    pincode || null, 
    userId
  ];

  db.query(sql, params, (err, result) => {
    if (err) return res.status(500).json({ message: err.message });
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({ 
      success: true, 
      message: `Account successfully switched to ${finalRole}!`,
      role: finalRole 
    });
  });
};

// ... (keep verifyEmail, forgotPassword, etc.)