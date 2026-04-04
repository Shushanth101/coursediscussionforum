import pool from "../config/db.js";
import bcrypt from "bcryptjs";
import { generateAccessToken, generateRefreshToken } from "../utils/generateTokens.js";
import jwt from "jsonwebtoken";
import { buildEmailOTPBody } from "./html.js";
import { sendMail } from "../services/emailService.js";

export const signup = async (req, res) => {
  try {
    const { full_name, email, password } = req.body;

    if (!full_name || !email || !password) {
      return res.status(400).json({ message: "Please fill all required fields" });
    }


    const emailExists = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
    if (emailExists.rows.length > 0) {
      return res.status(400).json({ message: "User already exists with this email" });
    }


    let user_id = email.split("@")[0].toLowerCase().replace(/[^a-z0-9._-]/g, "").substring(0, 25);


    const idExists = await pool.query("SELECT user_id FROM users WHERE user_id = $1", [user_id]);
    if (idExists.rows.length > 0) {
      const suffix = Math.random().toString(36).substring(2, 6);
      user_id = `${user_id.substring(0, 20)}_${suffix}`;
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const accessToken = generateAccessToken(user_id);
    const refreshToken = generateRefreshToken(user_id);

    const result = await pool.query(
      `INSERT INTO users (user_id, full_name, email, password, refresh_token)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING user_id, full_name, email, created_at, role`,
      [user_id, full_name, email, hashedPassword, refreshToken]
    );

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    res.status(201).json({
      user: result.rows[0],
      accessToken
    });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Please provide email and password" });
    }

    const result = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
    if (result.rows.length === 0) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const user = result.rows[0];

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const accessToken = generateAccessToken(user.user_id);
    const refreshToken = generateRefreshToken(user.user_id);


    await pool.query("UPDATE users SET refresh_token = $1 WHERE user_id = $2", [refreshToken, user.user_id]);

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    res.json({
      user: {
        user_id: user.user_id,
        full_name: user.full_name,
        email: user.email,
        role: user.role,
        created_at: user.created_at
      },
      accessToken
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const logout = async (req, res) => {
  try {
    const refreshToken = req.cookies.refreshToken;
    if (refreshToken) {
      await pool.query("UPDATE users SET refresh_token = NULL WHERE refresh_token = $1", [refreshToken]);
    }

    res.cookie("refreshToken", "", {
      httpOnly: true,
      expires: new Date(0),
    });
    res.status(200).json({ message: "Logged out successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getMe = async (req, res) => {
  try {
    res.status(200).json({ user: req.user });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const refreshTokens = async (req, res) => {
  try {
    const refreshToken = req.cookies.refreshToken;

    if (!refreshToken) {
      return res.status(401).json({ message: "Not authorized, no refresh token" });
    }

    // Verify token
    let decoded;
    try {
      decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET || 'fallback_refresh_secret');
    } catch (error) {
      return res.status(401).json({ message: "Not authorized, invalid refresh token" });
    }


    const result = await pool.query("SELECT * FROM users WHERE user_id = $1 AND refresh_token = $2", [decoded.userId, refreshToken]);

    if (result.rows.length === 0) {
      return res.status(401).json({ message: "Not authorized, refresh token mismatched" });
    }


    const accessToken = generateAccessToken(decoded.userId);

    res.status(200).json({ accessToken });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const updateUserProfile = async (req, res) => {
  try {
    const { profile_content } = req.body;
    const user_id = req.user.user_id;

    if (profile_content === undefined) {
      return res.status(400).json({ message: "profile_content is required" });
    }

    const result = await pool.query(
      "UPDATE users SET profile_content = $1 WHERE user_id = $2 RETURNING user_id, full_name, email, profile_content, created_at, role",
      [profile_content, user_id]
    );

    res.json({ user: result.rows[0] });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getUserProfile = async (req, res) => {
  try {
    const { user_id } = req.params;
    const result = await pool.query(
      "SELECT user_id, full_name, email, profile_content, created_at, role FROM users WHERE user_id = $1",
      [user_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({ user: result.rows[0] });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: "Email is required" });

    const user = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
    if (user.rows.length === 0) return res.json({ error: "User not found" });

    const otp = Math.floor(1000 + Math.random() * 9000);
    await pool.query(
      "UPDATE users SET otp = $1, otp_expires_at = NOW() + INTERVAL '10 minutes' WHERE email = $2",
      [otp, email]
    );

    await sendMail(email, buildEmailOTPBody(otp));
    res.json({ message: "OTP sent successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to send OTP" });
  }
};

export const verifyOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) return res.status(400).json({ error: "Email and OTP are required" });

    const user = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
    if (user.rows.length === 0) return res.json({ error: "User not found" });

    if (user.rows[0].otp?.toString() !== otp?.toString()) {
      return res.json({ error: "Invalid OTP" });
    }
    if (new Date(user.rows[0].otp_expires_at) < new Date()) {
      return res.json({ error: "OTP expired" });
    }

    res.json({ message: "OTP verified successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to verify OTP" });
  }
};

export const resetPassword = async (req, res) => {
  try {
    const { email, otp, password } = req.body;
    if (!email || !otp || !password) {
      return res.status(400).json({ error: "Email, OTP and password are required" });
    }

    const user = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
    if (user.rows.length === 0) return res.json({ error: "User not found" });

    if (user.rows[0].otp?.toString() !== otp?.toString()) {
      return res.json({ error: "Invalid OTP" });
    }
    if (new Date(user.rows[0].otp_expires_at) < new Date()) {
      return res.json({ error: "OTP expired" });
    }


    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    await pool.query(
      "UPDATE users SET otp = NULL, otp_expires_at = NULL, password = $1 WHERE email = $2",
      [hashedPassword, email]
    );
    res.json({ message: "Password reset successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to reset password" });
  }
};
