import { Request, Response } from "express";
import QuoteRequest from "./quote.model";
import Product from "../products/product.model";
import User from "../auth/auth.model";
import Order from "../orders/order.model";
import { saveNotification, sendPushNotification } from "../../services/notification.service";

/**
 * 1) Create Quote Request (Buyer)
 * POST /api/quotes/request
 */
export const requestQuote = async (req: Request, res: Response) => {
  try {
    const buyer = (req as any).user;
    const { productId, quantityRequested, notes, buyerProposedPrice } = req.body;

    if (!productId || !quantityRequested || quantityRequested < 1)
      return res.status(400).json({ error: "productId and valid quantityRequested required" });

    const product = await Product.findById(productId);
    if (!product) return res.status(404).json({ error: "Product not found" });

    if (!product.negotiable)
      return res.status(400).json({ error: "This product is NOT negotiable" });

    const supplier = await User.findById(product.supplier);
    if (!supplier) return res.status(404).json({ error: "Supplier not found" });
  const numericBuyerPrice = Number(buyerProposedPrice);

if (isNaN(numericBuyerPrice) || numericBuyerPrice <= 0) {
  return res.status(400).json({ error: "Valid buyerProposedPrice is required" });
}

    const quote = await QuoteRequest.create({
      buyer: buyer.id,
      supplier: supplier._id,
      product: product._id,
      productSnapshot: {
        name: product.name,
        unit: product.unit,
        price: product.price
      },
      buyerProposedPrice,
      quantityRequested,
      notes,
      status: "pending"
    });

    // Save DB notification
    await saveNotification(
      supplier._id.toString(),
      "quote_requested",
      "New Quote Request",
      `${(buyer as any).name || "A buyer"} requested a quote for ${product.name}`,
      { quoteId: quote._id.toString(), productId: product._id.toString() }
    );

    // Push
    if (Array.isArray(supplier.deviceTokens) && supplier.deviceTokens.length > 0) {
      await sendPushNotification(
        supplier.deviceTokens,
        "New Quote Request",
        `${(buyer as any).name || "A buyer"} requested a quote for ${product.name}`,
        { quoteId: quote._id.toString(), type: "quote_requested" }
      );
    }

    return res.json({ message: "Quote requested", quote });

  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
};


/**
 * 2) Buyer List My Quotes
 */
export const listMyQuotes = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const quotes = await QuoteRequest.find({ buyer: user.id })
      .populate("product", "name unit price negotiable")
      .populate("supplier", "name companyName phone")
      .sort({ createdAt: -1 });

    return res.json({ quotes });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
};


/**
 * 3) Supplier List Received Quotes
 */
export const listReceivedQuotes = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const quotes = await QuoteRequest.find({ supplier: user.id })
      .populate("product", "name unit price negotiable")
      .populate("buyer", "name phone")
      .sort({ createdAt: -1 });

    return res.json({ quotes });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
};


/**
 * 4) Supplier Respond (Counter / Accept / Reject)
 */
export const respondToQuote = async (req: Request, res: Response) => {
  try {
    const supplier = (req as any).user;
    const { id } = req.params;
    const { action, supplierProposedPrice, counterMinimumQty, supplierMessage } = req.body;

    const quote = await QuoteRequest.findById(id).populate("buyer").populate("product");
    if (!quote) return res.status(404).json({ error: "Quote not found" });

    if (quote.supplier.toString() !== supplier.id)
      return res.status(403).json({ error: "Not authorized" });

    if (!["counter", "accept", "reject"].includes(action))
      return res.status(400).json({ error: "Invalid action" });

    const buyer: any = quote.buyer;

    if (action === "counter") {
      const numericPrice = Number(supplierProposedPrice);

if (isNaN(numericPrice) || numericPrice <= 0)
  return res.status(400).json({ error: "Valid proposedPrice is required" });

      quote.counterPrice = numericPrice;
quote.counterMinimumQty = counterMinimumQty !== undefined && counterMinimumQty !== ''
  ? Number(counterMinimumQty)
  : null as any;

      quote.supplierMessage = supplierMessage || "";
      quote.status = "supplier_counter";

      // DB notification
      await saveNotification(
        buyer._id.toString(),
        "quote_countered",
        "Supplier Counter Offer",
        `${(supplier as any).name || "Supplier"} sent a counter offer for ${quote.productSnapshot?.name}`,
        { quoteId: quote._id.toString() }
      );

      // Push
      if (Array.isArray(buyer.deviceTokens) && buyer.deviceTokens.length > 0) {
        await sendPushNotification(
          buyer.deviceTokens,
          "Supplier Counter Offer",
          `${(supplier as any).name || "Supplier"} sent a counter offer for ${quote.productSnapshot?.name}`,
          { quoteId: quote._id.toString(), type: "quote_countered" }
        );
      }

    } else if (action === "accept") {
      if (!quote.productSnapshot || !quote.productSnapshot.price)
        return res.status(400).json({ error: "Product snapshot price missing" });

      quote.counterPrice = quote.counterPrice || quote.productSnapshot.price;
      quote.status = "supplier_accept";
      quote.supplierMessage = supplierMessage || "";

      await saveNotification(
        buyer._id.toString(),
        "quote_accepted",
        "Quote Accepted",
        `${(supplier as any).name || "Supplier"} accepted your quote request for ${quote.productSnapshot?.name}`,
        { quoteId: quote._id.toString() }
      );

      if (Array.isArray(buyer.deviceTokens) && buyer.deviceTokens.length > 0) {
        await sendPushNotification(
          buyer.deviceTokens,
          "Quote Accepted",
          `${(supplier as any).name || "Supplier"} accepted your quote request`,
          { quoteId: quote._id.toString(), type: "quote_accepted" }
        );
      }

    } else if (action === "reject") {
      quote.status = "rejected";
      quote.supplierMessage = supplierMessage || "";

      await saveNotification(
        buyer._id.toString(),
        "quote_rejected",
        "Quote Rejected",
        `${(supplier as any).name || "Supplier"} rejected your quote request`,
        { quoteId: quote._id.toString() }
      );

      if (Array.isArray(buyer.deviceTokens) && buyer.deviceTokens.length > 0) {
        await sendPushNotification(
          buyer.deviceTokens,
          "Quote Rejected",
          `${(supplier as any).name || "Supplier"} rejected your quote request`,
          { quoteId: quote._id.toString(), type: "quote_rejected" }
        );
      }
    }

    await quote.save();
    return res.json({ message: "Quote updated", quote });

  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
};


/**
 * 5) Buyer Accept or Cancel
 */
export const buyerActionOnQuote = async (req: Request, res: Response) => {
  try {
    const buyer = (req as any).user;
    const { id } = req.params;
    const { action } = req.body;

    const quote = await QuoteRequest.findById(id).populate("supplier").populate("product");
    if (!quote) return res.status(404).json({ error: "Quote not found" });

    if (quote.buyer.toString() !== buyer.id)
      return res.status(403).json({ error: "Not authorized" });

    const supplier: any = quote.supplier;

    if (action === "accept") {
      quote.status = "buyer_accept";

      await saveNotification(
        supplier._id.toString(),
        "quote_buyer_accepted",
        "Buyer Accepted Offer",
        `${(buyer as any).name || "Buyer"} accepted your offer for ${quote.productSnapshot?.name}`,
        
        { quoteId: quote._id.toString() }
      );

      if (Array.isArray(supplier.deviceTokens) && supplier.deviceTokens.length > 0) {
        await sendPushNotification(
          supplier.deviceTokens,
          "Buyer Accepted Offer",
          `${(buyer as any).name || "Buyer"} accepted your offer`,
          { quoteId: quote._id.toString(), type: "quote_buyer_accepted" }
        );
      }

    } else if (action === "cancel") {
      quote.status = "buyer_cancel";

      await saveNotification(
        supplier._id.toString(),
        "quote_cancelled",
        "Quote Cancelled",
        `${(buyer as any).name || "Buyer"} cancelled the quote request`,
        { quoteId: quote._id.toString() }
      );

      if (Array.isArray(supplier.deviceTokens) && supplier.deviceTokens.length > 0) {
        await sendPushNotification(
          supplier.deviceTokens,
          "Quote Cancelled",
          `${(buyer as any).name || "Buyer"} cancelled the quote request`,
          { quoteId: quote._id.toString(), type: "quote_cancelled" }
        );
      }
    }

    await quote.save();
    return res.json({ message: "Quote updated", quote });

  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
};


/**
 * 6) Convert Quote to Order
 */
export const convertQuoteToOrder = async (req: Request, res: Response) => {
  try {
    const buyer = (req as any).user;
    const { id } = req.params;
    const { delivery } = req.body;

    const quote = await QuoteRequest.findById(id).populate("product").populate("supplier");
    if (!quote) return res.status(404).json({ error: "Quote not found" });

    if (quote.buyer.toString() !== buyer.id)
      return res.status(403).json({ error: "Not authorized" });

    if (!["supplier_accept", "buyer_accept", "supplier_counter"].includes(quote.status))
      return res.status(400).json({ error: "Quote must be accepted before converting" });
    const quantityToOrder = quote.counterMinimumQty || quote.quantityRequested;
    const product: any = await Product.findById(quote.product._id);
    if (!product || product.stock < quantityToOrder)
      return res.status(400).json({ error: "Insufficient stock" });
    await Product.findOneAndUpdate(
      { _id: product._id, stock: { $gte: quantityToOrder} },
      { $inc: { stock: -quantityToOrder } }
    );

    if (!quote.productSnapshot?.price)
      return res.status(500).json({ error: "Product price snapshot missing" });

    let finalPrice = quote.productSnapshot.price;

    if (quote.status === "supplier_counter" && quote.counterPrice) {
      finalPrice = quote.counterPrice;
    } else if (quote.status === "supplier_accept" && quote.buyerProposedPrice) {
      finalPrice = quote.buyerProposedPrice;
    } else if (quote.status === "buyer_accept" && quote.counterPrice) {
      finalPrice = quote.counterPrice;
    }

    const subtotal = finalPrice * quantityToOrder;

    const buyerData: any = await User.findById(buyer.id);
    const finalPaymentMethod = "cash_on_delivery";
    const paymentStatus = "pending";

    const order = await Order.create({
      buyer: buyer.id,
      supplier: quote.supplier._id,
      items: [
        {
          product: product._id,
          name: product.name,
          unitPrice: finalPrice,
          quantity: quantityToOrder,
          unit: product.unit,
          subtotal
        }
      ],
      total: subtotal,
      paymentMethod: finalPaymentMethod,
      paymentStatus,
      delivery: delivery || buyerData.factoryLocation || {},
      status: "placed",
      reference: "RAW-" + Date.now(),
      stockReserved: false,
      deliveryTimeline: { placedAt: new Date() }
    });

    quote.status = "converted";
    await quote.save();

    // Notify supplier about conversion
    const supplier: any = quote.supplier;
    await saveNotification(
      supplier._id.toString(),
      "quote_converted",
      "Quote Converted to Order",
      `${(buyer as any).name || "Buyer"} converted the quote into an order (${order.reference})`,
      { orderId: order._id.toString(), quoteId: quote._id.toString() }
    );

    if (Array.isArray(supplier.deviceTokens) && supplier.deviceTokens.length > 0) {
      await sendPushNotification(
        supplier.deviceTokens,
        "Quote Converted to Order",
        `${(buyer as any).name || "Buyer"} converted the quote into an order (${order.reference})`,
        { orderId: order._id.toString(), type: "quote_converted" }
      );
    }

    return res.json({ message: "Quote converted to order", order });

  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
};
