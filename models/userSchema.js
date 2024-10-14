import mongoose from "mongoose";
import bcrypt from "bcryptjs"; // Menggunakan bcryptjs
import validator from "validator";
import orderSchema from "./orderSchema.js";
import Randomstring from "randomstring";
import OtpCode from "./otpCodeSchema.js";

// Schema alamat (opsional untuk e-commerce)
const addressSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: [true, "Full name is required"] },
    streetAddress: {
      type: String,
      required: [true, "Street address is required"],
    },
    city: { type: String, required: [true, "City is required"] },
    state: { type: String, required: [true, "State is required"] },
    postalCode: { type: String, required: [true, "Postal code is required"] },
    country: { type: String, required: [true, "Country is required"] },
    phone: { type: String, required: [true, "Phone number is required"] },
  },
  { _id: false }
);

// Schema user dengan mongoose
const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: [true, "Username is required"],
      unique: true,
      minlength: [3, "Username must be at least 3 characters long"],
      maxlength: [50, "Username cannot exceed 50 characters"],
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      validate: {
        validator: (v) => validator.isEmail(v),
        message: (props) => `${props.value} is not a valid email!`,
      },
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [6, "Password must be at least 6 characters long"],
      select: false, // Jangan tampilkan password di query secara default
    },
    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
    },
    phone: { type: String, required: [true, "Phone number is required"] },
    addresses: [addressSchema],
    orders: [orderSchema],
    resetPasswordToken: String,
    resetPasswordExpires: Date,
    isVerified: { type: Boolean, default: false },
    refreshToken: String,
    emailVerifiedAt: Date,
  },
  { timestamps: true }
);

// Hash password sebelum disimpan (tanpa try-catch)
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next(); // Jika password tidak diubah, lanjutkan

  const salt = await bcrypt.genSalt(10); // Buat salt untuk hashing
  this.password = await bcrypt.hash(this.password, salt); // Hash password
  next(); // Lanjut ke proses berikutnya
});

// Metode untuk membandingkan password
userSchema.methods.comparePassword = async function (enteredPassword) {
  return bcrypt.compare(enteredPassword, this.password); // Bandingkan password
};

// Metode untuk menghasilkan OTP
userSchema.methods.generateOtpCode = async function () {
  const otp = Randomstring.generate({ length: 6, charset: "numeric" });
  const now = new Date();

  return await OtpCode.findOneAndUpdate(
    { user: this._id },
    {
      otp,
      validUntil: now.setMinutes(now.getMinutes() + 5), // Berlaku 5 menit
    },
    { new: true, upsert: true }
  );
};

// Ekspor model User
const User = mongoose.model("User", userSchema);

export default User;
