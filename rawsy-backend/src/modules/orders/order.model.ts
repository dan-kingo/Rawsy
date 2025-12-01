import { Schema, model } from "mongoose";

const OrderItemSchema = new Schema(
  {
    product: { type: Schema.Types.ObjectId, ref: "Product", required: true },
    name: { type: String },        // denormalized for snapshot
    unitPrice: { type: Number, required: true },
    quantity: { type: Number, required: true },
    unit: { type: String },        // e.g. kg, ton
    subtotal: { type: Number, required: true } // unitPrice * quantity
  },
  { _id: false }
);

const OrderSchema = new Schema(
  {
    buyer: { type: Schema.Types.ObjectId, ref: "User", required: true },

    // For marketplaces we keep items array (single-supplier assumption or multi-supplier later)
    items: { type: [OrderItemSchema], required: true },

    // If we enforce single-supplier orders, store supplier here (optional)
    supplier: { type: Schema.Types.ObjectId, ref: "User", required: true },

    total: { type: Number, required: true },

    // Payment & delivery
    paymentMethod: {
      type: String,
      enum: ["cash_on_delivery"],
      default: "cash_on_delivery"
    },
    paymentStatus: {
      type: String,
      enum: ["pending", "pending_review", "completed", "failed"],
      default: "pending"
    },
   paymentProof: { type: String, default: null },
    delivery: {
      address: { type: String },
      contactName: { type: String },
      contactPhone: { type: String },
      expectedDeliveryDate: { type: Date }
    },

    stockReserved: { type: Boolean, default: false },

    // Order lifecycle
    status: {
      type: String,
      enum: ["placed", "confirmed", "rejected", "in_transit", "delivered", "cancelled"],
      default: "placed"
    },
  deliveryTimeline: {
   placedAt: { type: Date },
   confirmedAt: { type: Date },
   rejectedAt: { type: Date },
   shippedAt: { type: Date },
   deliveredAt: { type: Date },
   cancelledAt: { type: Date }
},
trackingNumber: { type: String, default: null },
isDelayed: { type: Boolean, default: false },
expectedDeliveryDate: {
  type: Date,
  default: null
},

 activityLogs: [
      {
        action: { type: String, required: true },
        message: { type: String, required: true },
        actor: { type: Schema.Types.ObjectId, ref: "User" },
        createdAt: { type: Date, default: Date.now }
      }
    ],
    // optional notes from buyer or supplier
    buyerNote: { type: String },
    supplierNote: { type: String },

    // keep basic invoice/reference fields
    reference: { type: String } // e.g. RAWSY-20251117-0001
  },
  
  { timestamps: true }
);

export default model("Order", OrderSchema);
