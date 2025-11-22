import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { OAuth2Client } from "google-auth-library";
import axios from "axios";

import User from "../models/User.js";
import authenticateToken from "../middleware/auth.js";
import {
  validateRegister,
  validateLogin,
  handleValidationErrors,
} from "../middleware/validation.js";

const router = express.Router();

// ✅ CORRECT OAuth2Client initialization
const googleClient = new OAuth2Client(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  `${process.env.FRONTEND_URL}/oauth-callback`
);

/* --------------------------- REGISTER --------------------------- */
router.post("/register", validateRegister, handleValidationErrors, async (req, res) => {
  try {
    const { email, name, password } = req.body;

    const existing = await User.findOne({ email });
    if (existing)
      return res.status(400).json({ error: "User already exists with this email" });

    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await User.create({
      email,
      name,
      password: hashedPassword,
    });

    const token = jwt.sign(
      { id: user._id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.status(201).json({
      message: "User registered successfully",
      token,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

/* ----------------------------- LOGIN ---------------------------- */
router.post("/login", validateLogin, handleValidationErrors, async (req, res) => {
  try {
    const { email, password } = req.body;

    let user = await User.findOne({ email }).select("+password");
    if (!user) return res.status(401).json({ error: "Invalid email or password" });

    if (!user.password)
      return res.status(401).json({
        error: "This email is registered with Google. Please use Google Login.",
      });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ error: "Invalid email or password" });

    user.lastLogin = new Date();
    await user.save();

    const token = jwt.sign(
      { id: user._id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({
      message: "Login successful",
      token,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        lastLogin: user.lastLogin,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

/* ------------------------ GOOGLE OAUTH URL ---------------------- */
router.get("/google/url", (req, res) => {
  try {
    console.log("🔐 Generating Google OAuth URL...");
    console.log("Client ID:", process.env.GOOGLE_CLIENT_ID);
    console.log("Redirect URI:", `${process.env.FRONTEND_URL}/oauth-callback`);

    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?${new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID,
      redirect_uri: `${process.env.FRONTEND_URL}/oauth-callback`,
      response_type: "code",
      scope: "openid profile email",
      access_type: "offline",
      prompt: "consent",
    })}`;

    console.log("✅ Generated Auth URL:", authUrl);
    res.json({ success: true, authUrl });
  } catch (error) {
    console.error("❌ Google OAuth URL error:", error);
    res.status(500).json({ error: "Failed to generate OAuth URL" });
  }
});

/* ------------------------ GOOGLE CALLBACK ----------------------- */
router.post("/google/callback", async (req, res) => {
  console.log("🔄 Processing Google OAuth callback...");
  console.log("Received CODE:", req.body.code);

  try {
    const { code } = req.body;
    if (!code) {
      return res.status(400).json({ error: "Authorization code required" });
    }

    // ✅ METHOD 1: Using manual token exchange (more reliable)
    console.log("🔄 Exchanging code for tokens...");
    
    const tokenResponse = await axios.post('https://oauth2.googleapis.com/token',
      new URLSearchParams({
        code: code,
        client_id: process.env.GOOGLE_CLIENT_ID,
        client_secret: process.env.GOOGLE_CLIENT_SECRET,
        redirect_uri: `${process.env.FRONTEND_URL}/oauth-callback`,
        grant_type: 'authorization_code'
      }), {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      }
    );

    const tokens = tokenResponse.data;
    console.log("✅ Successfully received tokens from Google");

    // Verify the ID token
    const ticket = await googleClient.verifyIdToken({
      idToken: tokens.id_token,
      audience: process.env.GOOGLE_CLIENT_ID
    });

    const payload = ticket.getPayload();
    console.log("✅ Google user payload:", {
      googleId: payload.sub,
      email: payload.email,
      name: payload.name
    });

    const { sub: googleId, email, name, picture: avatar } = payload;

    // Find or create user
    let user = await User.findOne({
      $or: [
        { googleId },
        { email }
      ]
    });

    if (!user) {
      console.log("👤 Creating new user from Google OAuth");
      user = await User.create({
        googleId,
        email,
        name,
        avatar
      });
    } else {
      console.log("🔗 User found, updating last login");
      if (!user.googleId) {
        user.googleId = googleId;
      }
      if (avatar && !user.avatar) {
        user.avatar = avatar;
      }
    }

    user.lastLogin = new Date();
    await user.save();

    const token = jwt.sign(
      { id: user._id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    console.log("✅ Google OAuth successful for:", user.email);

    res.json({
      success: true,
      message: "Google login successful",
      token,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        avatar: user.avatar
      },
    });

  } catch (error) {
    console.error("❌ Google OAuth callback error:", error);
    
    // Detailed error logging
    if (error.response) {
      console.error("Google API Response Error:", error.response.data);
      console.error("Status:", error.response.status);
    }
    
    res.status(500).json({
      error: "Google authentication failed",
      details: error.message
    });
  }
});

/* -------------------------- DEBUG ROUTE ------------------------- */
router.get("/debug/oauth-config", (req, res) => {
  res.json({
    clientId: process.env.GOOGLE_CLIENT_ID ? "✅ Set" : "❌ Missing",
    clientSecret: process.env.GOOGLE_CLIENT_SECRET ? "✅ Set" : "❌ Missing",
    redirectUri: `${process.env.FRONTEND_URL}/oauth-callback`,
    frontendUrl: process.env.FRONTEND_URL,
    backendUrl: process.env.BACKEND_URL
  });
});

/* -------------------------- GET USER ---------------------------- */
router.get("/user", authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    res.json(user);
  } catch (error) {
    console.error("Get user error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;


