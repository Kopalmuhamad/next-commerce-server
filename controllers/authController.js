import { asyncHandler } from "../middlewares/asyncHandler.js";
import User from "../models/userSchema.js";
import jwt from "jsonwebtoken";
import { sendEmail } from "../utils/sendEmail.js";
import OtpCode from "../models/otpCodeSchema.js";

// Function to sign JWT
const signToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: "1h",
  });
};

const generateRefreshToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_TOKEN_REFRESH, {
    expiresIn: "7d",
  });
};

// Function to create response with JWT and cookie
const createResToken = async (user, statusCode, res) => {
  const accessToken = signToken(user._id); // Correct reference to user._id
  const refreshToken = generateRefreshToken(user._id);

  await User.findByIdAndUpdate(user._id, {
    refreshToken,
  });

  const cookieOptionToken = {
    expires: new Date(Date.now() + 24 * 60 * 60 * 1000), // Expires in 6 days
    httpOnly: true, // Cookie accessible only by web server
    secure: process.env.NODE_ENV === "production", // Set secure to true in production
  };

  const cookiesOptionRefresh = {
    expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Expires in 7 days
    httpOnly: true, // Cookie accessible only by web server
    secure: process.env.NODE_ENV === "production", // Set secure to true in production
  };

  // Set the JWT token as cookie
  res.cookie("jwt", accessToken, cookieOptionToken);
  res.cookie("refreshToken", refreshToken, cookiesOptionRefresh);

  // Hide password field from response
  user.password = undefined;

  // Send response
  res.status(statusCode).json({
    success: true,
    accessToken,
    user,
  });
};

// Register new user
export const register = asyncHandler(async (req, res) => {
  const { username, email, password, phone } = req.body;

  // Validate required fields
  if (!username || !email || !password || !phone) {
    res.status(400);
    throw new Error(
      "Please provide all required fields: username, email, password, and phone."
    );
  }

  // Check if the email is already registered
  const userExists = await User.findOne({ email });
  if (userExists) {
    res.status(400);
    throw new Error("User with this email already exists.");
  }

  // Check if it's the first user and set role as 'admin' or 'user'
  const isFirstUser = (await User.countDocuments()) === 0 ? "admin" : "user";

  // Create new user
  const user = await User.create({
    username,
    email,
    password,
    phone,
    role: isFirstUser,
  });

  const otpData = await user.generateOtpCode();

  await sendEmail({
    to: email,
    subject: "Success Generate OTP Code",
    html: `
          <!doctype html>
            <html>
            <head>
              <meta http-equiv=3D"Content-Type" content=3D"text/html; charset=3DUTF-8">
            </head>
              <body style=3D"font-family: sans-serif;">
                <div style=3D"display: block; margin: auto; max-width: 600px;" class=3D"main">
                  <h1 style=3D"font-size: 18px; font-weight: bold; margin-top: 20px">Congrats ${user.username} you have register👻</h1>
                  <p>Please use OTP Code below to verify your email, time expires otp code in 5 minutes from now</p>
                  <p style="text-align:center;background-color:yellow;padding:10px;font-weight:bold;font-size:20px;border-radius:10px;">
                    ${otpData.otp}
                  </p>
                </div>
              </body>
            </html>
          `,
  });

  // Use createResToken to send JWT and response
  createResToken(user, 201, res);
});

export const generateOtpCode = asyncHandler(async (req, res) => {
  const currentUser = await User.findById(req.user._id);

  const otpData = await currentUser.generateOtpCode();

  await sendEmail({
    to: currentUser.email,
    subject: "Success Regenerate Otp Code 👻",
    html: `
          <!doctype html>
            <html>
            <head>
              <meta http-equiv=3D"Content-Type" content=3D"text/html; charset=3DUTF-8">
            </head>
              <body style=3D"font-family: sans-serif;">
                <div style=3D"display: block; margin: auto; max-width: 600px;" class=3D"main">
                  <h1 style=3D"font-size: 18px; font-weight: bold; margin-top: 20px">Congrats ${currentUser.username} you have success generate otp code</h1>
                  <p>Please use OTP Code below to verify your email</p>
                  <p style="text-align:center;background-color:yellow;padding:10px;font-weight:bold;font-size:20px;border-radius:10px;">
                    ${otpData.otp}
                  </p>
                  <strong style="font-size:12px;">time expires otp code in 5 minutes from now</strong>
                </div>
              </body>
            </html>
          `,
  });

  res.status(200).json({
    success: true,
    message: "OTP Code successfully generated and sent.",
  });
});

export const verificationUser = asyncHandler(async (req, res) => {
  // Validation for otp
  if (!req.body.otp) {
    res.status(400);
    throw new Error("Please provide otp code.");
  }

  // Validation if otp undefined
  const otp_code = await OtpCode.findOne({
    otp: req.body.otp,
    user: req.user._id,
  });

  if (!otp_code) {
    res.status(400);
    throw new Error("Invalid OTP code.");
  }

  // Update isVerified to true
  const userData = await User.findById(req.user._id);

  await User.findByIdAndUpdate(userData._id, {
    isVerified: true,
    emailVerifiedAt: Date.now(),
  });

  return res.status(200).json({
    success: true,
    message: "User successfully verified.",
  });
});

export const refreshToken = asyncHandler(async (req, res) => {
  const refreshToken = req.cookies.refreshToken;
  if (!refreshToken) {
    res.status(401);
    throw new Error("Refresh token not found.");
  }

  const user = await User.findOne({ refreshToken });
  if (!user) {
    res.status(401);
    throw new Error("Invalid Refresh Token.");
  }

  jwt.verify(refreshToken, process.env.JWT_TOKEN_REFRESH, (err, decoded) => {
    if (err) {
      res.status(401);
      throw new Error("Invalid Refresh Token.");
    }

    const newToken = generateRefreshToken(decoded.id);
    createResToken(user, 200, res, newToken);
  });
});

// Login user
export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  // Validate email and password
  if (!email || !password) {
    res.status(400);
    throw new Error("Please provide both email and password.");
  }

  // Check if the user exists
  const user = await User.findOne({ email }).select("+password"); // Select password explicitly since it's usually not selected by default
  if (!user) {
    res.status(400);
    throw new Error("User not found with this email.");
  }

  // Check if the password matches
  const isPasswordValid = await user.comparePassword(password);
  if (!isPasswordValid) {
    res.status(400);
    throw new Error("Incorrect password.");
  }

  // Use createResToken to send JWT and response if login is successful
  createResToken(user, 200, res);
});

// Get user
export const getUser = asyncHandler(async (req, res) => {
  if (!req.user) {
    res.status(404);
    throw new Error("User not found.");
  }

  res.status(200).json({
    success: true,
    user: req.user,
  });
});

// Logout user
export const logout = asyncHandler(async (req, res) => {
  res.cookie("jwt", null, {
    httpOnly: true,
    expires: new Date(Date.now()),
  });

  await User.findByIdAndUpdate(req.user._id, {
    refreshToken: null,
  });

  res.cookie("refreshToken", null, {
    httpOnly: true,
    expires: new Date(Date.now()),
  });

  res.status(200).json({
    success: true,
    message: "Logged out successfully.",
  });
});
