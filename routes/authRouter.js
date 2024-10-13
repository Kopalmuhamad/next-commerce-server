import express from "express";
import {
  getUser,
  login,
  logout,
  register,
  generateOtpCode,
  verificationUser,
  refreshToken,
} from "../controllers/authController.js";
import { protectedMiddleware } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.get("/getUser", protectedMiddleware, getUser);
router.get("/logout", protectedMiddleware, logout);
router.post("/generateOtpCode", protectedMiddleware, generateOtpCode);
router.post("/verificationAccount", protectedMiddleware, verificationUser);
router.post("/refreshToken", protectedMiddleware, refreshToken);

export default router;
