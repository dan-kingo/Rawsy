import { Schema, model } from "mongoose";

const ProductSchema = new Schema(
  {
    supplier: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    name: { type: String, required: true },
    description: { type: String },
    category: { type: String, required: true },

    price: { type: Number, required: true },
    unit: { type: String, required: true }, 
    stock: { type: Number, required: true },

    // 💰 Discount
    discount: {
      percentage: { type: Number, default: 0 },
      active: { type: Boolean, default: false },
      expiresAt: { type: Date, default: null }
    },

    // 🖼️ Images
    image: { type: String, default: null },
    images: { type: [String], default: [] },

    // 🛑 Moderation
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending"      
    },
    paymentMethod: {
  type: [String],
  enum: ["cash_on_delivery"],
  default: ["cash_on_delivery"]
},
    rejectionReason: { type: String, default: null },

    // ⭐ Rating
    rating: {
      average: { type: Number, default: 0 },
      count: { type: Number, default: 0 }
    },

    negotiable: { type: Boolean, default: false },
    flagged: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// 💵 Virtual final price with discount
ProductSchema.virtual("finalPrice").get(function () {
  if (this.discount?.active && this.discount.percentage > 0) {
    return this.price - (this.price * this.discount.percentage) / 100;
  }
  return this.price;
});

ProductSchema.set("toJSON", { virtuals: true });
ProductSchema.set("toObject", { virtuals: true });

export default model("Product", ProductSchema);
