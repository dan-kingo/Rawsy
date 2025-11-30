import { Request, Response } from "express";
import Review from "./review.model";
import Order from "../orders/order.model";
import User from "../auth/auth.model";
import mongoose from "mongoose";

/**
 * Submit a review for an order.
 * - Only the buyer/manufacturer who created the order can review
 * - Only if order.status === "delivered"
 * - Only one review per order
 */
export const submitReview = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user; // manufacturer
    const { orderId } = req.params;
    const { rating, comment } = req.body;

    if (!mongoose.Types.ObjectId.isValid(orderId)) return res.status(400).json({ error: "Invalid order id" });
    if (!rating || rating < 1 || rating > 5) return res.status(400).json({ error: "Rating must be 1-5" });

    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ error: "Order not found" });

    // Only the buyer can review
    if (order.buyer.toString() !== user.id) return res.status(403).json({ error: "Only buyer can review this order" });

    // Only delivered orders can be reviewed
    if (order.status !== "delivered") return res.status(400).json({ error: "Only delivered orders can be reviewed" });

    // Prevent duplicate review for same order
    const existing = await Review.findOne({ order: orderId });
    if (existing) return res.status(400).json({ error: "Review already submitted for this order" });

    // Create review
    const review = await Review.create({
      supplier: order.supplier,
      manufacturer: user.id,
      order: orderId,
      rating,
      comment
    });

    // Recalculate supplier rating & count (aggregation)
    const agg = await Review.aggregate([
      { $match: { supplier: order.supplier, approved: true } },
      { $group: { _id: "$supplier", avg: { $avg: "$rating" }, count: { $sum: 1 } } }
    ]);

    const stat = agg[0] || { avg: 0, count: 0 };
    await User.findByIdAndUpdate(order.supplier, {
      $set: { averageRating: stat.avg || 0, reviewCount: stat.count || 0 }
    });

    return res.json({ message: "Review submitted", review });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
};

/**
 * List reviews for a supplier
 */
export const listSupplierReviews = async (req: Request, res: Response) => {
  try {
    const { supplierId } = req.params;
    const page = Number(req.query.page || 1);
    const limit = Number(req.query.limit || 10);
    const skip = (page - 1) * limit;

    const reviews = await Review.find({ supplier: supplierId, approved: true })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("manufacturer", "name email");

    const total = await Review.countDocuments({ supplier: supplierId, approved: true });

    return res.json({ reviews, page, limit, total });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
};

/**
 * Supplier rating summary (fast for mobile list)
 */
export const supplierRatingSummary = async (req: Request, res: Response) => {
  try {
    const { supplierId } = req.params;

    // read denormalized fields from User (faster)
    const user = await User.findById(supplierId).select("averageRating reviewCount name");
    if (!user) return res.status(404).json({ error: "Supplier not found" });

    return res.json({
      supplierId,
      name: user.name,
      averageRating: user.averageRating || 0,
      reviewCount: user.reviewCount || 0
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
};
/**
 * Get reviews submitted by the logged-in manufacturer
 */
export const myReviews = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user; // logged-in manufacturer
    const reviews = await Review.find({ manufacturer: user.id }).select("order"); // only need order ids
    res.json(reviews);
  } catch (err: any) {
    res.status(500).json({ error: "Could not fetch user reviews" });
  }
};
