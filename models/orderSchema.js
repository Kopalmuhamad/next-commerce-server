import mongoose from "mongoose";

// Define order schema
const orderSchema = new mongoose.Schema(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: [true, "Product ID is required"],
    },
    quantity: {
      type: Number,
      required: [true, "Quantity is required"],
      min: [1, "Quantity must be at least 1"],
    },
    totalPrice: {
      type: Number,
      required: [true, "Total price is required"],
    },
    status: {
      type: String,
      enum: ["pending", "shipped", "delivered", "cancelled"],
      default: "pending",
    },
    orderedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    _id: false, // If you want to use order as an embedded schema
  }
);

// Export order schema
export default orderSchema;
