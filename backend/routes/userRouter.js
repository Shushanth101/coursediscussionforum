import express from "express";
import { signup, login, logout, getMe, refreshTokens, updateUserProfile, getUserProfile } from "../controllers/userController.js";
import { protectRoute } from "../middleware/authMiddleware.js";
import { forgotPassword, verifyOTP, resetPassword } from "../controllers/userController.js";


const router = express.Router();

router.post("/signup", signup);
router.post("/login", login);
router.post("/logout", logout);
router.post("/refresh", refreshTokens);
router.get("/me", protectRoute, getMe);
router.put("/profile", protectRoute, updateUserProfile);
router.get("/:user_id", protectRoute, getUserProfile);
router.post("/forgot-password", forgotPassword);
router.post("/verify-otp", verifyOTP);
router.post("/reset-password", resetPassword);

export default router