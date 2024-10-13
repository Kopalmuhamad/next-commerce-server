import User from "../models/userSchema.js";
import { asyncHandler } from "../middlewares/asyncHandler.js";

export const allUser = asyncHandler(async (req, res) => {
  const users = await User.find();

  res.status(200).json({
    success: true,
    data: users,
  });
});
