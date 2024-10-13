import mongoose from "mongoose";

const { Schema } = mongoose;

const otpSchema = new Schema({
  user: {
    type: Schema.Types.ObjectId,
    ref: "User",
  },
  otp: {
    type: String,
    required: [true, "Otp Code is required"],
  },
  validUntil: {
    type: Date,
    required: true,
    expires: 300,
  },
});

const OtpCode = mongoose.model("OtpCode", otpSchema);

export default OtpCode;
