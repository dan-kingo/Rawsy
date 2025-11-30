import { Request, Response } from "express";
import Product from "../products/product.model";
import { saveNotification, sendPushNotification } from "../../services/notification.service";
import User from "../auth/auth.model";

export const reviewProduct = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { action, reason } = req.body; // "approve", "reject"

    const product = await Product.findById(id).populate("supplier");
    if (!product) return res.status(404).json({ error: "Product not found" });

    if (action === "approve") {
      product.status = "approved";
      product.rejectionReason = " ";
    } else if (action === "reject") {
      product.status = "rejected";
      product.rejectionReason = reason || "No reason provided";
    } else {
      return res.status(400).json({ error: "Invalid action" });
    }

    await product.save();

    const supplier: any = product.supplier;

    const type = action === "approve" ? "product_approved" : "product_rejected";
    const title = action === "approve" ? "Product Approved" : "Product Rejected";
    const message =
      action === "approve"
        ? `${product.name} has been approved and is now visible`
        : `${product.name} was rejected. Reason: ${reason}`;

    await saveNotification(
      supplier._id.toString(),
      type as any,
      title,
      message,
      { productId: product._id.toString() }
    );

    if (supplier.deviceTokens?.length > 0) {
      await sendPushNotification(
        supplier.deviceTokens,
        title,
        message,
        { productId: product._id.toString(), type }
      );
    }

    return res.json({ message: `Product ${action}`, product });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
};
// Toggle flag
export const toggleFlagProduct = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const product = await Product.findById(id);
    if (!product) return res.status(404).json({ error: "Product not found" });

    // Simple toggle
    product.flagged = !product.flagged;
    await product.save();

    res.json({
      message: `Product ${product.flagged ? "flagged" : "unflagged"} successfully`,
      product
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};
