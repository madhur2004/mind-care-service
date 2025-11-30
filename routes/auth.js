// import express from "express";
// import bcrypt from "bcryptjs";
// import jwt from "jsonwebtoken";
// import { OAuth2Client } from "google-auth-library";
// import axios from "axios";

// import User from "../models/User.js";
// import authenticateToken from "../middleware/auth.js";
// import {
//   validateRegister,
//   validateLogin,
//   handleValidationErrors,
// } from "../middleware/validation.js";

// const router = express.Router();

// // ✅ CORRECT OAuth2Client initialization
// const googleClient = new OAuth2Client(
//   process.env.GOOGLE_CLIENT_ID,
//   process.env.GOOGLE_CLIENT_SECRET,
//   `${process.env.FRONTEND_URL}/oauth-callback`
// );

// /* --------------------------- REGISTER --------------------------- */
// router.post("/register", validateRegister, handleValidationErrors, async (req, res) => {
//   try {
//     const { email, name, password } = req.body;

//     const existing = await User.findOne({ email });
//     if (existing)
//       return res.status(400).json({ error: "User already exists with this email" });

//     const hashedPassword = await bcrypt.hash(password, 12);

//     const user = await User.create({
//       email,
//       name,
//       password: hashedPassword,
//     });

//     const token = jwt.sign(
//       { id: user._id, email: user.email },
//       process.env.JWT_SECRET,
//       { expiresIn: "7d" }
//     );

//     res.status(201).json({
//       message: "User registered successfully",
//       token,
//       user: {
//         id: user._id,
//         email: user.email,
//         name: user.name,
//         createdAt: user.createdAt,
//       },
//     });
//   } catch (error) {
//     console.error("Registration error:", error);
//     res.status(500).json({ error: "Internal server error" });
//   }
// });

// /* ----------------------------- LOGIN ---------------------------- */
// router.post("/login", validateLogin, handleValidationErrors, async (req, res) => {
//   try {
//     const { email, password } = req.body;

//     let user = await User.findOne({ email }).select("+password");
//     if (!user) return res.status(401).json({ error: "Invalid email or password" });

//     if (!user.password)
//       return res.status(401).json({
//         error: "This email is registered with Google. Please use Google Login.",
//       });

//     const isMatch = await bcrypt.compare(password, user.password);
//     if (!isMatch) return res.status(401).json({ error: "Invalid email or password" });

//     user.lastLogin = new Date();
//     await user.save();

//     const token = jwt.sign(
//       { id: user._id, email: user.email },
//       process.env.JWT_SECRET,
//       { expiresIn: "7d" }
//     );

//     res.json({
//       message: "Login successful",
//       token,
//       user: {
//         id: user._id,
//         email: user.email,
//         name: user.name,
//         lastLogin: user.lastLogin,
//       },
//     });
//   } catch (error) {
//     console.error("Login error:", error);
//     res.status(500).json({ error: "Internal server error" });
//   }
// });

// /* ------------------------ GOOGLE OAUTH URL ---------------------- */
// router.get("/google/url", (req, res) => {
//   try {
//     console.log("🔐 Generating Google OAuth URL...");
//     console.log("Client ID:", process.env.GOOGLE_CLIENT_ID);
//     console.log("Redirect URI:", `${process.env.FRONTEND_URL}/oauth-callback`);

//     const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?${new URLSearchParams({
//       client_id: process.env.GOOGLE_CLIENT_ID,
//       redirect_uri: `${process.env.FRONTEND_URL}/oauth-callback`,
//       response_type: "code",
//       scope: "openid profile email",
//       access_type: "offline",
//       prompt: "consent",
//     })}`;

//     console.log("✅ Generated Auth URL:", authUrl);
//     res.json({ success: true, authUrl });
//   } catch (error) {
//     console.error("❌ Google OAuth URL error:", error);
//     res.status(500).json({ error: "Failed to generate OAuth URL" });
//   }
// });

// /* ------------------------ GOOGLE CALLBACK ----------------------- */
// router.post("/google/callback", async (req, res) => {
//   console.log("🔄 Processing Google OAuth callback...");
//   console.log("Received CODE:", req.body.code);

//   try {
//     const { code } = req.body;
//     if (!code) {
//       return res.status(400).json({ error: "Authorization code required" });
//     }

//     // ✅ METHOD 1: Using manual token exchange (more reliable)
//     console.log("🔄 Exchanging code for tokens...");
    
//     const tokenResponse = await axios.post('https://oauth2.googleapis.com/token',
//       new URLSearchParams({
//         code: code,
//         client_id: process.env.GOOGLE_CLIENT_ID,
//         client_secret: process.env.GOOGLE_CLIENT_SECRET,
//         redirect_uri: `${process.env.FRONTEND_URL}/oauth-callback`,
//         grant_type: 'authorization_code'
//       }), {
//         headers: {
//           'Content-Type': 'application/x-www-form-urlencoded'
//         }
//       }
//     );

//     const tokens = tokenResponse.data;
//     console.log("✅ Successfully received tokens from Google");

//     // Verify the ID token
//     const ticket = await googleClient.verifyIdToken({
//       idToken: tokens.id_token,
//       audience: process.env.GOOGLE_CLIENT_ID
//     });

//     const payload = ticket.getPayload();
//     console.log("✅ Google user payload:", {
//       googleId: payload.sub,
//       email: payload.email,
//       name: payload.name
//     });

//     const { sub: googleId, email, name, picture: avatar } = payload;

//     // Find or create user
//     let user = await User.findOne({
//       $or: [
//         { googleId },
//         { email }
//       ]
//     });

//     if (!user) {
//       console.log("👤 Creating new user from Google OAuth");
//       user = await User.create({
//         googleId,
//         email,
//         name,
//         avatar
//       });
//     } else {
//       console.log("🔗 User found, updating last login");
//       if (!user.googleId) {
//         user.googleId = googleId;
//       }
//       if (avatar && !user.avatar) {
//         user.avatar = avatar;
//       }
//     }

//     user.lastLogin = new Date();
//     await user.save();

//     const token = jwt.sign(
//       { id: user._id, email: user.email },
//       process.env.JWT_SECRET,
//       { expiresIn: "7d" }
//     );

//     console.log("✅ Google OAuth successful for:", user.email);

//     res.json({
//       success: true,
//       message: "Google login successful",
//       token,
//       user: {
//         id: user._id,
//         email: user.email,
//         name: user.name,
//         avatar: user.avatar
//       },
//     });

//   } catch (error) {
//     console.error("❌ Google OAuth callback error:", error);
    
//     // Detailed error logging
//     if (error.response) {
//       console.error("Google API Response Error:", error.response.data);
//       console.error("Status:", error.response.status);
//     }
    
//     res.status(500).json({
//       error: "Google authentication failed",
//       details: error.message
//     });
//   }
// });

// /* -------------------------- DEBUG ROUTE ------------------------- */
// router.get("/debug/oauth-config", (req, res) => {
//   res.json({
//     clientId: process.env.GOOGLE_CLIENT_ID ? "✅ Set" : "❌ Missing",
//     clientSecret: process.env.GOOGLE_CLIENT_SECRET ? "✅ Set" : "❌ Missing",
//     redirectUri: `${process.env.FRONTEND_URL}/oauth-callback`,
//     frontendUrl: process.env.FRONTEND_URL,
//     backendUrl: process.env.BACKEND_URL
//   });
// });

// /* -------------------------- GET USER ---------------------------- */
// router.get("/user", authenticateToken, async (req, res) => {
//   try {
//     const user = await User.findById(req.user.id);
//     res.json(user);
//   } catch (error) {
//     console.error("Get user error:", error);
//     res.status(500).json({ error: "Internal server error" });
//   }
// });

// export default router;

//--------------------------------------------------4

import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { OAuth2Client } from "google-auth-library";
import axios from "axios";
import crypto from "crypto";

import User from "../models/User.js";
import authenticateToken from "../middleware/auth.js";
import {
  validateRegister,
  validateLogin,
  handleValidationErrors,
} from "../middleware/validation.js";
import { sendWelcomeEmail, sendPasswordResetEmail } from "../utils/emailServices.js";

const router = express.Router();

// ✅ CORRECT OAuth2Client initialization
const googleClient = new OAuth2Client(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  `${process.env.FRONTEND_URL}/oauth-callback`
);

// ✅ Generate reset token
const generateResetToken = () => {
  return crypto.randomBytes(32).toString('hex');
};

// ✅ Hash reset token for storage
const hashResetToken = (token) => {
  return crypto.createHash('sha256').update(token).digest('hex');
};

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

    // ✅ Send Welcome Email
    try {
      await sendWelcomeEmail(user);
      console.log('✅ Welcome email sent to:', user.email);
    } catch (emailError) {
      console.error('❌ Welcome email failed:', emailError);
      // Continue even if email fails
    }

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

    const isNewUser = !user;

    if (!user) {
      console.log("👤 Creating new user from Google OAuth");
      user = await User.create({
        googleId,
        email,
        name,
        avatar
      });

      // ✅ Send Welcome Email for new Google users
      try {
        await sendWelcomeEmail(user);
        console.log('✅ Welcome email sent to Google user:', user.email);
      } catch (emailError) {
        console.error('❌ Welcome email failed for Google user:', emailError);
        // Continue even if email fails
      }
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

/* --------------------- FORGOT PASSWORD --------------------- */
router.post("/forgot-password", async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email }).select('+password');
    console.log("🔍 Forgot password request for email:", user);
    
    if (!user) {
      return res.json({ 
        success: true, 
        message: "If an account with that email exists, a password reset link has been sent." 
      });
    }

    // ✅ UPDATED: Allow Google users to set password
    if (!user.password && user.googleId) {
      // Allow Google users to set password for first time
      const resetToken = generateResetToken();
      user.resetPasswordToken = hashResetToken(resetToken);
      user.resetPasswordExpires = Date.now() + 3600000;
      await user.save();

      try {
        await sendPasswordResetEmail(user, resetToken);
        console.log('✅ Password setup email sent to Google user:', user.email);
        return res.json({
          success: true,
          message: "Since you registered with Google, we've sent you a link to set up a password for your account."
        });
      } catch (emailError) {
        console.error('❌ Password setup email failed:', emailError);
        return res.status(500).json({ error: "Failed to send email" });
      }
    }

    // Regular email/password users
    const resetToken = generateResetToken();
    user.resetPasswordToken = hashResetToken(resetToken);
    user.resetPasswordExpires = Date.now() + 3600000;
    await user.save();

    try {
      await sendPasswordResetEmail(user, resetToken);
      console.log('✅ Password reset email sent to:', user.email);
    } catch (emailError) {
      console.error('❌ Password reset email failed:', emailError);
      return res.status(500).json({ error: "Failed to send reset email" });
    }

    res.json({
      success: true,
      message: "Password reset link has been sent to your email"
    });

  } catch (error) {
    console.error("Forgot password error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

/* --------------------- RESET PASSWORD --------------------- */
router.post("/reset-password", async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({ error: "Token and new password are required" });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: "Password must be at least 6 characters long" });
    }

    // Hash the token to compare with stored hash
    const hashedToken = hashResetToken(token);

    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ error: "Invalid or expired reset token" });
    }

    // Update password
    user.password = await bcrypt.hash(newPassword, 12);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    res.json({
      success: true,
      message: "Password reset successfully. You can now login with your new password."
    });

  } catch (error) {
    console.error("Reset password error:", error);
    res.status(500).json({ error: "Internal server error" });
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
