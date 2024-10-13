import jwt from "jsonwebtoken";
import User from "../models/userSchema.js";
import { asyncHandler } from "./asyncHandler.js";

export const protectedMiddleware = asyncHandler(async (req, res, next) => {
  let token;

  token = req.cookies.jwt;

  //? validation if token not exists
  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = await User.findById(decoded.id).select("-password"); // Use decoded.id

      if (!req.user) {
        res.status(401);
        throw new Error("Not authorized, user not found");
      }

      next();
    } catch (error) {
      res.status(401);
      throw new Error("Not authorized, invalid token.");
    }
  } else {
    res.status(401);
    throw new Error("Not authorized, no token.");
  }
});

export const adminMiddleware = asyncHandler(async (req, res, next) => {
  if (req.user && req.user.role === "admin") {
    next();
  } else {
    res.status(401);
    throw new Error("Not authorized as an admin.");
  }
});

export const verificationMiddleware = asyncHandler((req, res, next) => {
  if (req.user && req.user.isVerified && req.user.emailVerifiedAt) {
    next();
  } else {
    res.status(401);
    throw new Error("Not authorized, User not verified.");
  }
});
