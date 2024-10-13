import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import validator from "validator";
import orderSchema from "./orderSchema.js";
import Randomstring from "randomstring";
import OtpCode from "./otpCodeSchema.js";

// Define address schema (useful for storing multiple addresses)
const addressSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: [true, "Full name is required"],
    },
    streetAddress: {
      type: String,
      required: [true, "Street address is required"],
    },
    city: {
      type: String,
      required: [true, "City is required"],
    },
    state: {
      type: String,
      required: [true, "State is required"],
    },
    postalCode: {
      type: String,
      required: [true, "Postal code is required"],
    },
    country: {
      type: String,
      required: [true, "Country is required"],
    },
    phone: {
      type: String,
      required: [true, "Phone number is required"],
    },
  },
  {
    _id: false,
  }
);

// Define user schema for e-commerce
const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: [true, "Username is required"],
      unique: [true, "Username must be unique"],
      minlength: [3, "Username must be at least 3 characters long"],
      maxlength: [50, "Username cannot exceed 50 characters"],
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: [true, "Email must be unique"],
      validate: {
        validator: function (v) {
          return validator.isEmail(v); // Use validator to check if email is valid
        },
        message: (props) => `${props.value} is not a valid email!`,
      },
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [6, "Password must be at least 6 characters long"],
    },
    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
    },
    phone: {
      type: String,
      required: [true, "Phone number is required"],
    },
    addresses: [addressSchema],
    orders: [orderSchema], // Use orderSchema from imported file
    resetPasswordToken: String,
    resetPasswordExpires: Date,
    isVerified: {
      type: Boolean,
      default: false,
    },
    refreshToken: {
      type: String,
    },
    emailVerifiedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Pre-save hook to hash the password before saving it
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (err) {
    next(err);
  }
});

// Method to compare password for login
userSchema.methods.comparePassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Method to generate otp code
userSchema.methods.generateOtpCode = async function () {
  const randomstring = Randomstring.generate({
    length: 6,
    charset: "numeric",
  });

  let now = new Date();

  const otp = await OtpCode.findOneAndUpdate(
    {
      user: this._id,
    },
    {
      otp: randomstring,
      validUntil: now.setMinutes(now.getMinutes() + 5),
    },
    {
      new: true,
      upsert: true,
    }
  );

  return otp;
};

// Export user model
const User = mongoose.model("User", userSchema);

export default User;
