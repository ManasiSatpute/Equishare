import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import db from "../config/db.js";
import sendEmail from "../utils/email.js";

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;


   //SIGNUP

export const signup = (req, res) => {
  const { email, password, role } = req.body;
  

  if (!emailRegex.test(email)) {
    return res.status(400).json({ message: "Invalid email format" });
  }

  if (password.length < 8) {
    return res.status(400).json({
      message: "Password must be at least 8 characters",
    });
  }

  db.query("SELECT * FROM users WHERE email = ?", [email], (err, existing) => {
    if (err) return res.status(500).json({ message: err.message });

    if (existing.length) {
      return res.status(400).json({ message: "User already exists" });
    }

    bcrypt.hash(password, 10, (err, hashed) => {
      if (err) return res.status(500).json({ message: err.message });

      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      const expiry = new Date(Date.now() + 10 * 60 * 1000); // 10 min

      db.query(
  "INSERT INTO users (email, password, role, otp, otp_expiry, otp_type, is_verified) VALUES (?, ?, ?, ?, ?, ?, ?)",
  [email, hashed, role, otp, expiry, "email_verification", 0],
        async (err, result) => {
          if (err) return res.status(500).json({ message: err.message });

          await sendEmail({
            email,
            subject: "EquiShare Email Verification OTP",
            html: `
  <h2>EquiShare Email Verification</h2>
  <p>Use the OTP below to verify your email address:</p>
  <h1 style="letter-spacing:5px">${otp}</h1>
  <p>This OTP will expire in <b>10 minutes</b>.</p>
  <p>If you did not create an account, ignore this email.</p>
`,
          });

          res.json({
            success: true,
            message: "OTP sent to email",
          });
        }
      );
    });
  });
};

   //LOGIN

export const login = (req, res) => {
  const { email, password } = req.body;

  db.query("SELECT * FROM users WHERE email = ?", [email], (err, rows) => {
    if (err) return res.status(500).json({ message: err.message });

    if (!rows.length)
      return res.status(400).json({ message: "Invalid email or password" });

    const user = rows[0];

    bcrypt.compare(password, user.password, (err, isMatch) => {
      if (err) return res.status(500).json({ message: err.message });

      if (!isMatch)
        return res.status(400).json({ message: "Invalid email or password" });

      if (user.is_verified === 0) {
        return res.status(403).json({
          message: "Please verify your email before logging in"
        });
      }

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
        }
      });
    });
  });
};


   //FORGOT PASSWORD

export const forgotPassword = (req, res) => {
  const { email } = req.body;

  db.query("SELECT * FROM users WHERE email = ?", [email], (err, rows) => {
    if (err) return res.status(500).json({ message: err.message });

    if (!rows.length)
      return res.status(400).json({ message: "User not found" });

    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    const expiry = new Date(Date.now() + 10 * 60 * 1000);

    db.query(
      "UPDATE users SET otp = ?, otp_expiry = ?, otp_type = ? WHERE email = ?",
[otp, expiry, "password_reset", email],
      (err) => {
        if (err) return res.status(500).json({ message: err.message });

        sendEmail({
          email,
          subject: "Password Reset OTP",
          html: `
            <h1>Password Reset Request</h1>
            <p>Your OTP is <strong>${otp}</strong></p>
            <p>This OTP is valid for 10 minutes.</p>
          `
        });

        res.json({
          success: true,
          message: "OTP sent to your email"
        });
      }
    );
  });
};


   //VERIFY OTP

  export const verifyOtp = (req, res) => {
  const { email, otp } = req.body;

  db.query("SELECT * FROM users WHERE email = ?", [email], (err, rows) => {
    if (err) return res.status(500).json({ message: err.message });

    if (!rows.length)
      return res.status(400).json({ message: "User not found" });

    const user = rows[0];

    if (user.otp !== otp)
      return res.status(400).json({ message: "Invalid OTP" });

    if (new Date(user.otp_expiry) < new Date())
      return res.status(400).json({ message: "OTP expired" });

    // EMAIL VERIFICATION FLOW
    if (user.otp_type === "email_verification") {
      db.query(
        "UPDATE users SET is_verified = 1, otp = NULL, otp_expiry = NULL, otp_type = NULL WHERE email = ?",
        [email],
        (err) => {
          if (err) return res.status(500).json({ message: err.message });

          return res.json({
            success: true,
            message: "Email verified successfully",
          });
        }
      );
    }

    // PASSWORD RESET FLOW
    else if (user.otp_type === "password_reset") {
      return res.json({
        success: true,
        message: "OTP verified. You can reset password",
      });
    }

    else {
      return res.status(400).json({
        message: "Invalid OTP type",
      });
    }
  });
};


   //RESET PASSWORD

export const resetPassword = (req, res) => {
  const { email, otp, newPassword } = req.body;

  if (!newPassword || newPassword.length < 8) {
    return res.status(400).json({
      message: "Password must be at least 8 characters"
    });
  }

  db.query("SELECT * FROM users WHERE email = ?", [email], (err, rows) => {
    if (err) return res.status(500).json({ message: err.message });

    if (!rows.length)
      return res.status(400).json({ message: "User not found" });

    const user = rows[0];

    if (user.otp !== otp)
      return res.status(400).json({ message: "Invalid OTP" });

    if (new Date(user.otp_expiry) < new Date())
      return res.status(400).json({ message: "OTP expired" });
     if (user.otp_type !== "password_reset")
    return res.status(400).json({ message: "Invalid OTP type for password reset" });


    bcrypt.hash(newPassword, 10, (err, hashed) => {
      if (err) return res.status(500).json({ message: err.message });

      db.query(
        "UPDATE users SET password = ?, otp = NULL, otp_expiry = NULL WHERE email = ?",
        [hashed, email],
        (err) => {
          if (err) return res.status(500).json({ message: err.message });

          res.json({
            success: true,
            message: "Password reset successful"
          });
        }
      );
    });
  });
};


   //UPGRADE ROLE

export const upgradeToOwner = (req, res) => {
  const userId = req.user.id;

  const { role: targetRole, phone, city, state, street_address, pincode } =
    req.body;

  const validRoles = ["user", "owner"];

  const finalRole = validRoles.includes(targetRole)
    ? targetRole
    : "owner";

  if (finalRole === "owner" && (!phone || !city)) {
    return res.status(400).json({
      message: "Phone and City are required to activate Owner mode."
    });
  }

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