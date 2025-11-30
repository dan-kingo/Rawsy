import { Schema, model } from "mongoose";

const QuoteSchema = new Schema(
  {
    buyer: { type: Schema.Types.ObjectId, ref: "User", required: true },
    supplier: { type: Schema.Types.ObjectId, ref: "User", required: true },

    product: { type: Schema.Types.ObjectId, ref: "Product", required: true },

    // Snapshot for product details at time of request
    productSnapshot: {
      name: { type: String, required: true },
      unit: { type: String, required: true },
      price: { type: Number, required: true }, // current price when quote created
      stock: { type: Number, default: null }
    },

    quantityRequested: { type: Number, required: true },
    notes: { type: String, default: "" },

    // Price offered by supplier in response
    buyerProposedPrice: { type: Number, default: null },
supplierProposedPrice: { type: Number, default: null },


    // Supplier counter minimum quantity (optional)
    minimumOrderQty: { type: Number, default: null },
// Supplier counter-offer
    counterPrice: { type: Number, default: null },
    counterMinimumQty: { type: Number, default: null },
    // Supplier optional message in counter
    supplierMessage: { type: String, default: "" },

    // 🎯 Negotiation Status
    status: {
      type: String,
      enum: [
        "pending",            // buyer requested
        "supplier_counter",   // supplier responded / modified offer
        "buyer_accept",       // buyer accepted supplier offer (ready to checkout)
        "buyer_cancel",       // buyer cancelled quote request
        "supplier_accept",// supplier accepts buyer proposed price fully
        "rejected",    // supplier rejects buyer propose 
        "converted"           // converted to order after checkout
      ],
      default: "pending"
    }
  },
  { timestamps: true }
);

export default model("QuoteRequest", QuoteSchema);
