import express from "express";
import { allUser } from "../controllers/userController.js";
import {
  protectedMiddleware,
  verificationMiddleware,
  adminMiddleware,
} from "../middlewares/authMiddleware.js";

const router = express.Router();

router.get("/allUser", protectedMiddleware, adminMiddleware, allUser);
router.get(
  "/haveVerified",
  protectedMiddleware,
  verificationMiddleware,
  (req, res) => {
    return res.status(200).json({
      success: true,
      message: "User have verified.",
    });
  }
);

export default router;
