import { Request, Response } from "express";
import Order from "./order.model";
import Product from "../products/product.model";
import { generateInvoicePDF } from "../../services/invoice.service";
import { addOrderLog } from "./order.utils";
import { getStatusBadge, mapOrderTimeline } from "./order.status";
import { sendPushNotification } from "../../services/notification.service";
import User from "../auth/auth.model";
import { saveNotification } from "../../services/notification.service";
import cloudinary from "../../config/cloudinary.config";

export const placeOrder = async (req: Request, res: Response) => {
  try {
    const buyer = (req as any).user;
    const { productId, quantity, paymentMethod, delivery } = req.body;

    if (!productId || !quantity) {
      return res.status(400).json({ error: "Product and quantity are required" });
    }

    // Atomically check stock AND decrement
    const product = await Product.findOneAndUpdate(
      {
        _id: productId,
        stock: { $gte: quantity }
      },
      {
        $inc: { stock: -quantity }
      },
      { new: true }
    );

    if (!product) {
      return res.status(400).json({ error: "Insufficient stock or product not found" });
    }

    const supplierId = product.supplier.toString();

    // Calculate final price with discount
    let unitPrice = product.price;
    if (product.discount?.active && product.discount.percentage > 0) {
      unitPrice = product.price - (product.price * product.discount.percentage) / 100;
    }

    const subtotal = unitPrice * quantity;
    const availableMethods = product.paymentMethod || ["bank_transfer"];
    const finalPaymentMethod =
      paymentMethod && availableMethods.includes(paymentMethod)
        ? paymentMethod
        : availableMethods[0];
    const items = [
      {
        product: product._id,
        name: product.name,
        unitPrice,
        quantity,
        unit: product.unit,
        subtotal
      }
    ];

    const order = await Order.create({
      buyer: buyer.id,
      supplier: supplierId,
      items,
      total: subtotal,
      paymentMethod: finalPaymentMethod,
      delivery,
      status: "placed",
      stockReserved: true,
      reference: "RAW-" + Date.now(),
      deliveryTimeline: {
        placedAt: new Date()
      }
    });

    // Response to client
    res.json({
      message: "Order placed successfully",
      order
    });

    // Log
    await addOrderLog(order._id.toString(), buyer.id, "placed", "Order was placed by buyer");

    // Push notification to supplier
    const supplierUser = await User.findById(supplierId);
    const buyerUser = await User.findById(buyer.id).select("name email");
let buyerName = "a buyer";
if (buyerUser && buyerUser.name) {
  buyerName = buyerUser.name;
}
    if (!supplierUser) {
      console.warn("Supplier not found, skipping notification:", supplierId);
    } else if (supplierUser.deviceTokens?.length > 0) {
      await sendPushNotification(
        supplierUser.deviceTokens,
        "New Order Received",
        `You have a new order from ${buyerName}`,
        {
          orderId: order._id.toString(),
          type: "order_placed"
        }
      );
    }
    await saveNotification(
  supplierId,
  "order_placed",
  "New Order Received",
  `You have a new order from ${buyerName}`,
  { orderId: order._id.toString() }
);

  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};
export const acceptOrder = async (req: Request, res: Response) => {
  try {
    const supplier = (req as any).user;
    const { id } = req.params;

    const order = await Order.findById(id);
    if (!order) return res.status(404).json({ error: "Order not found" });

    if (order.supplier.toString() !== supplier.id) {
      return res.status(403).json({ error: "You cannot accept this order" });
    }

    if (order.status !== "placed") {
      return res.status(400).json({ error: "Only placed orders can be accepted" });
    }

    if (!order.deliveryTimeline) order.deliveryTimeline = {};

    order.status = "confirmed";
    order.deliveryTimeline.confirmedAt = new Date();
    await order.save();

    res.json({ message: "Order accepted", order });

    // Log
    await addOrderLog(order._id.toString(), supplier.id, "confirmed", "Supplier accepted the order");

    // Notify buyer
    const buyerUser = await User.findById(order.buyer);
if (!buyerUser) {
      console.warn("Buyer not found, skipping notification:", order.buyer);
    } else if (buyerUser?.deviceTokens?.length > 0) {
      await sendPushNotification(
        buyerUser.deviceTokens,
        "Order Accepted",
        "Your order has been accepted by the supplier",
        {
          orderId: order._id.toString(),
          type: "order_accepted"
        }
      );
    }
    await saveNotification(
  order.buyer.toString(),
  "order_confirmed",
  "Order Accepted",
  "Your order has been accepted by the supplier",
  { orderId: order._id.toString() }
);

  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};
export const rejectOrder = async (req: Request, res: Response) => {
  try {
    const supplier = (req as any).user;
    const { id } = req.params;

    const order = await Order.findById(id);
    if (!order) return res.status(404).json({ error: "Order not found" });

    if (order.supplier.toString() !== supplier.id) {
      return res.status(403).json({ error: "You cannot reject this order" });
    }

    if (order.status !== "placed") {
      return res.status(400).json({ error: "Only placed orders can be rejected" });
    }

    // Restore stock if needed
    if (order.stockReserved) {
      const item = order.items[0];
      await Product.findByIdAndUpdate(item.product, {
        $inc: { stock: item.quantity }
      });
      order.stockReserved = false;
    }

    if (!order.deliveryTimeline) order.deliveryTimeline = {};

    order.status = "rejected";
    order.deliveryTimeline.rejectedAt = new Date();
    await order.save();

    res.json({
      message: "Order rejected and stock restored",
      order
    });

    // Log
    await addOrderLog(order._id.toString(), supplier.id, "rejected", "Supplier rejected the order");

    // Notify buyer
    const buyerUser = await User.findById(order.buyer);
if (!buyerUser) {
      console.warn("Buyer not found, skipping notification:", order.buyer);
    }else if (buyerUser?.deviceTokens?.length > 0) {
      await sendPushNotification(
        buyerUser.deviceTokens,
        "Order Rejected",
        "The supplier rejected your order",
        {
          orderId: order._id.toString(),
          type: "order_rejected"
        }
      );
    }
    await saveNotification(
  order.buyer.toString(),
  "order_rejected",
  "Order Rejected",
  "Your order has been rejected by the supplier",
  { orderId: order._id.toString() }
);

  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};


export const markOrderShipped = async (req: Request, res: Response) => {
  try {
    const supplier = (req as any).user;
    const { id } = req.params;

    const { trackingNumber, expectedDeliveryDate } = req.body;

    const order = await Order.findById(id);
    if (!order) return res.status(404).json({ error: "Order not found" });

    // Only the supplier of this order can update
    if (!order.supplier || order.supplier.toString() !== supplier.id) {
      return res.status(403).json({ error: "You cannot update this order" });
    }

    // Only confirmed orders can move to in_transit
    if (order.status !== "confirmed") {
      return res.status(400).json({ error: "Only confirmed orders can be shipped" });
    }
    if (!order.deliveryTimeline) {
     order.deliveryTimeline = {};
    }
    order.status = "in_transit";
order.deliveryTimeline.shippedAt = new Date();

order.trackingNumber = trackingNumber || null;

order.expectedDeliveryDate = expectedDeliveryDate
  ? new Date(expectedDeliveryDate)
  : (null as unknown as Date);

await order.save();


    res.json({ message: "Order marked as in_transit", order });
  await addOrderLog(order._id.toString(), supplier.id, "shipped", "Order was marked as shipped");
   
  const buyerUser = await User.findById(order.buyer);
if (!buyerUser) {
      console.warn("Buyer not found, skipping notification:", order.buyer);
    } else if (buyerUser?.deviceTokens?.length > 0) {
      await sendPushNotification(
        buyerUser.deviceTokens,
        "Order Shipped",
        "Your order has been shipped by the supplier",
        {
          orderId: order._id.toString(),
          type: "order_shipped"
        }
      );
    }
    await saveNotification(
  order.buyer.toString(),
  "order_in_transit",
  "Order Shipped",
  "Your order has been shipped by the supplier",
  { orderId: order._id.toString() }
);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};
export const markOrderDelivered = async (req: Request, res: Response) => {
  try {
    const supplier = (req as any).user;
    const { id } = req.params;

    const order = await Order.findById(id);
    if (!order) return res.status(404).json({ error: "Order not found" });

    if (!order.supplier || order.supplier.toString() !== supplier.id) {
      return res.status(403).json({ error: "You cannot update this order" });
    }

    // Only in_transit orders can be delivered
    if (order.status !== "in_transit") {
      return res.status(400).json({ error: "Order must be in_transit before delivered" });
    }
    if (!order.deliveryTimeline) {
     order.deliveryTimeline = {};
    }
    order.status = "delivered";
    order.deliveryTimeline.deliveredAt = new Date();
    await order.save();

    res.json({ message: "Order marked as delivered", order });
   await addOrderLog(order._id.toString(), supplier.id, "delivered", "Order delivered to buyer");
    
const buyerUser = await User.findById(order.buyer);
if (!buyerUser) {
      console.warn("Buyer not found, skipping notification:", order.buyer);
    } else if (buyerUser?.deviceTokens?.length > 0) {
      await sendPushNotification(
        buyerUser.deviceTokens,
        "Order Delivered",
        "Your order has been delivered",
        {
          orderId: order._id.toString(),
          type: "order_delivered"
        }
      );
    }
    await saveNotification(
  order.buyer.toString(),
  "order_delivered",
  "Order Delivered",
  "Your order has been delivered",
  { orderId: order._id.toString() }
);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};
export const getMyOrders = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;

    const orders = await Order.find({ buyer: user.id })
      .populate("supplier", "name email phone")
      .populate("items.product", "name");

    res.json({ orders });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};
export const getSupplierOrders = async (req: Request, res: Response) => {
  try {
    const supplier = (req as any).user;

    const orders = await Order.find({ supplier: supplier.id })
      .populate("buyer", "name email phone")
      .populate("items.product", "name");

    res.json({ orders });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};
export const getAllOrdersAdmin = async (req: Request, res: Response) => {
  try {
    const { page = 1, size = 20, sort = "-createdAt" } = req.query;

    const limit = Number(size);
    const skip = (Number(page) - 1) * limit;

    const orders = await Order.find()
      .populate("buyer", "name email phone")
      .populate("supplier", "name email phone")
      .populate("items.product", "name")
      .sort(sort as string)
      .skip(skip)
      .limit(limit);

    const total = await Order.countDocuments();

    res.json({
      total,
      page: Number(page),
      size: limit,
      orders
    });

  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const filterOrdersAdmin = async (req: Request, res: Response) => {
  try {
    const { status, supplier, buyer, startDate, endDate,minTotal,maxTotal, paymentMethod } = req.query;

    const query: any = {};

    // Filter by status
    if (status) query.status = status;

    // Filter by supplier
    if (supplier) query.supplier = supplier;

    // Filter by buyer
    if (buyer) query.buyer = buyer;
if (paymentMethod) query.paymentMethod = paymentMethod;

if (minTotal || maxTotal) {
  query.total = {};
  if (minTotal) query.total.$gte = Number(minTotal);
  if (maxTotal) query.total.$lte = Number(maxTotal);
}
    // Filter by date range
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate as string);
      if (endDate) query.createdAt.$lte = new Date(endDate as string);
    }

    const orders = await Order.find(query)
      .populate("buyer", "name email phone")
      .populate("supplier", "name email phone")
      .populate("items.product", "name");

    res.json({ orders });

  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};
export const cancelOrder = async (req: Request, res: Response) => {
  try {
    const buyer = (req as any).user;
    const { id } = req.params;

    const order = await Order.findById(id);
    if (!order) return res.status(404).json({ error: "Order not found" });

    // Only buyer who created the order can cancel
    if (order.buyer.toString() !== buyer.id) {
      return res.status(403).json({ error: "You cannot cancel this order" });
    }

    // Only cancel if still in placed status
    if (order.status !== "placed") {
      return res.status(400).json({ error: "Only placed orders can be cancelled" });
    }

    // Restore stock if reserved
    if (order.stockReserved) {
      const item = order.items[0];
      await Product.findByIdAndUpdate(item.product, {
        $inc: { stock: item.quantity }
      });
      order.stockReserved = false;
    }
    if (!order.deliveryTimeline) {
     order.deliveryTimeline = {};
    }
    order.status = "cancelled";
    order.deliveryTimeline.cancelledAt = new Date();
    await order.save();

    res.json({
      message: "Order cancelled successfully, stock restored",
      order
    });
   await addOrderLog(order._id.toString(), buyer.id, "cancelled", "Order cancelled by buyer");

    const supplierUser = await User.findById(order.supplier);
    const buyerUser = await User.findById(buyer.id).select("name email");
    let buyerName = "a buyer";
if (buyerUser && buyerUser.name) {
  buyerName = buyerUser.name;
}
if (!supplierUser) {
      console.warn("Supplier not found, skipping notification:", order.supplier);
    } else if (supplierUser?.deviceTokens?.length > 0) {
      await sendPushNotification(
        supplierUser.deviceTokens,
        "Order Cancelled",
        `The order from ${buyerName} has been cancelled`,
        {
          orderId: order._id.toString(),
          type: "order_cancelled"
        }
      );
    }
   await saveNotification(
  order.supplier.toString(),
  "order_cancelled",
  "Order Cancelled",
  `The order from ${buyerName} has been cancelled`,
  { orderId: order._id.toString() }
);

  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};
export const downloadBuyerInvoice = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const user = (req as any).user;

    const order = await Order.findById(id)
      .populate("buyer", "name email phone")
      .populate("supplier", "name email phone")
      .populate("items.product", "name");

    if (!order) return res.status(404).json({ error: "Order not found" });

    if (
      user.role !== "admin" &&
      order.buyer._id.toString() !== user.id
    ) {
      return res.status(403).json({ error: "Access denied" });
    }

    const filePath = await generateInvoicePDF(order, "buyer");
    res.download(filePath);

  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};
export const downloadSupplierInvoice = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const user = (req as any).user;

    const order = await Order.findById(id)
      .populate("buyer", "name email phone")
      .populate("supplier", "name email phone")
      .populate("items.product", "name");

    if (!order) return res.status(404).json({ error: "Order not found" });

    if (
      user.role !== "admin" &&
      order.supplier._id.toString() !== user.id
    ) {
      return res.status(403).json({ error: "Access denied" });
    }

    const filePath = await generateInvoicePDF(order, "supplier");
    res.download(filePath);

  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

// Return a JSON URL that the frontend can open (authenticated) for buyer invoice
export const getBuyerInvoiceUrl = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const user = (req as any).user;

    const order = await Order.findById(id)
      .populate("buyer", "name email phone")
      .populate("supplier", "name email phone")
      .populate("items.product", "name");

    if (!order) return res.status(404).json({ error: "Order not found" });

    if (user.role !== "admin" && order.buyer._id.toString() !== user.id) {
      return res.status(403).json({ error: "Access denied" });
    }

    const filePath = await generateInvoicePDF(order, "buyer");
    const filename = filePath.split('/').pop() || filePath;
    const base = `${req.protocol}://${req.get('host')}`;
    const url = `${base}/invoices/files/${encodeURIComponent(filename)}`;

    return res.json({ filename, url });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
};

// Return a JSON URL for supplier invoice
export const getSupplierInvoiceUrl = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const user = (req as any).user;

    const order = await Order.findById(id)
      .populate("buyer", "name email phone")
      .populate("supplier", "name email phone")
      .populate("items.product", "name");

    if (!order) return res.status(404).json({ error: "Order not found" });

    if (user.role !== "admin" && order.supplier._id.toString() !== user.id) {
      return res.status(403).json({ error: "Access denied" });
    }

    const filePath = await generateInvoicePDF(order, "supplier");
    const filename = filePath.split('/').pop() || filePath;
    const base = `${req.protocol}://${req.get('host')}`;
    const url = `${base}/invoices/files/${encodeURIComponent(filename)}`;

    return res.json({ filename, url });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
};
export const getOrderTimeline = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const order = await Order.findById(id)
      .populate("buyer", "name email phone")
      .populate("supplier", "name email phone");

    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    return res.json({
      status: order.status,
      reference: order.reference,
      buyer: order.buyer,
      supplier: order.supplier,
      timeline: order.deliveryTimeline
    });

  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
};
export const getOrderActivityLogs = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const order = await Order.findById(id)
      .populate("activityLogs.actor", "name email role")
      .select("activityLogs");

    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    return res.json({ logs: order.activityLogs });

  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};
export const getOrderStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const order = await Order.findById(id)
      .populate("buyer", "name email")
      .populate("supplier", "name email");

    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    const badge = getStatusBadge(order.status);
    const timeline = mapOrderTimeline(order);

    return res.json({
      id: order._id,
      reference: order.reference,
      status: order.status,
      badge,
      timeline
    });

  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
};
export const getOrderTracking = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const user = (req as any).user;

    const order = await Order.findById(id)
      .populate("buyer", "name email phone")
      .populate("supplier", "name email phone");

    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }
    // Only buyer, supplier, or admin can view tracking
    if (
      user.role !== "admin" &&
      user.id !== order.buyer._id.toString() &&
      user.id !== order.supplier._id.toString()
    ) {
      return res.status(403).json({ error: "Access denied" });
    }

    res.json({
      orderId: order._id,
      reference: order.reference,
      status: order.status,
      trackingNumber: order.trackingNumber,
      expectedDeliveryDate: order.expectedDeliveryDate,
      supplier: order.supplier,
      buyer: order.buyer,
      timeline: order.deliveryTimeline
    });

  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};
export const getTrackingList = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;

    let filter: any = {};

    if (user.role === "manufacturer") {
      filter.buyer = user.id; // buyer sees their orders
    } 
    else if (user.role === "supplier") {
      filter.supplier = user.id; // supplier sees their orders
    }
    // admin sees everything (no filter)

    const orders = await Order.find(filter)
      .populate("buyer", "name email phone")
      .populate("supplier", "name email phone")
      .sort({ createdAt: -1 });

    const formatted = orders.map((o) => ({
      id: o._id,
      reference: o.reference,
      status: o.status,
      total: o.total,
      supplier: o.supplier,
      buyer: o.buyer,
      timeline: {
        placedAt: o.deliveryTimeline?.placedAt,
        confirmedAt: o.deliveryTimeline?.confirmedAt,
        shippedAt: o.deliveryTimeline?.shippedAt,
        deliveredAt: o.deliveryTimeline?.deliveredAt,
        cancelledAt: o.deliveryTimeline?.cancelledAt,
      },
      createdAt: o.createdAt
    }));

    return res.json({ orders: formatted });

  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
};
export const getOrderTrackingDetails = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { orderId } = req.params;

    const order = await Order.findById(orderId)
      .populate("buyer", "name email phone")
      .populate("supplier", "name email phone")
      .populate("items.product", "name");

    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    // Access Control: Buyer, Supplier, or Admin
    if (
      user.role !== "admin" &&
      order.buyer._id.toString() !== user.id &&
      order.supplier._id.toString() !== user.id
    ) {
      return res.status(403).json({ error: "Access denied" });
    }

    // Status → badge + progress mapping
    const statusMap: any = {
      placed: { color: "gray", progress: 20 },
      confirmed: { color: "blue", progress: 40 },
      in_transit: { color: "orange", progress: 70 },
      delivered: { color: "green", progress: 100 },
      rejected: { color: "red", progress: 100 },
      cancelled: { color: "red", progress: 100 }
    };

    const mappedStatus = statusMap[order.status] || {
      color: "gray",
      progress: 0
    };
    // Timeline mapping (Step 11C)
    const timeline = {
      placed: order.deliveryTimeline?.placedAt || null,
      confirmed: order.deliveryTimeline?.confirmedAt || null,
      shipped: order.deliveryTimeline?.shippedAt || null,
      delivered: order.deliveryTimeline?.deliveredAt || null,
      cancelled: order.deliveryTimeline?.cancelledAt || null
    };

    return res.json({
      orderId: order._id,
      reference: order.reference,
      status: order.status,
      badge: mappedStatus.color,
      progress: mappedStatus.progress,

      total: order.total,
      trackingNumber: order.trackingNumber || null,
      expectedDeliveryDate: order.expectedDeliveryDate || null,

      buyer: order.buyer,
      supplier: order.supplier,
      items: order.items,

      timeline,
      activityLogs: order.activityLogs || []
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
};
export const uploadPaymentProof = async (req: Request, res: Response) => {
  try {
    const buyer = (req as any).user;
    const { id } = req.params;

    const order = await Order.findById(id);
    if (!order) return res.status(404).json({ error: "Order not found" });
    if (order.buyer.toString() !== buyer.id)
      return res.status(403).json({ error: "Not authorized" });

    if (!req.file) return res.status(400).json({ error: "Payment proof file required" });

    const upload = await cloudinary.uploader.upload(req.file.path);

    order.paymentProof = upload.secure_url;
    order.paymentStatus = "pending_review";
    await order.save();

    return res.json({ message: "Payment proof uploaded successfully", url: upload.secure_url });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
};
export const approvePayment = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const user = (req as any).user;

    const order = await Order.findById(id);
    if (!order) return res.status(404).json({ error: "Order not found" });

    if (order.supplier.toString() !== user.id && user.role !== "admin")
      return res.status(403).json({ error: "Not authorized" });

    order.paymentStatus = "completed";
    await order.save();

    return res.json({ message: "Payment approved" });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
};
export const rejectPayment = async (req: Request, res: Response) => {
  const { id } = req.params;
  const user = (req as any).user;

  const order = await Order.findById(id);
  if (!order) return res.status(404).json({ error: "Order not found" });

  if (order.supplier.toString() !== user.id && user.role !== "admin")
    return res.status(403).json({ error: "Not authorized" });

  order.paymentStatus = "failed";
  order.paymentProof = null as any ;
  await order.save();

  return res.json({ message: "Payment rejected. Buyer needs to re-upload proof." });
};
