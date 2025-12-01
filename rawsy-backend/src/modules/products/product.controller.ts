import { Request, Response } from "express";
import Product from "./product.model";
import { notifyWishlistUsers } from "../../services/notification.service";

/**
 * ================================
 *   CREATE PRODUCT (Supplier Only)
 * ================================
 */
export const createProduct = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;

    const {
      name,
      description,
      category,
      price,
      unit,
      stock,
      negotiable,
      paymentMethods // array expected
    } = req.body;

    if (!name || !category || !price || !unit || stock == null) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const allowedMethods = ["cash_on_delivery"];

    // If supplier provided payment methods, validate them
    let finalPaymentMethods = ["cash_on_delivery"];

    if (Array.isArray(paymentMethods) && paymentMethods.length > 0) {
      const invalid = paymentMethods.filter(m => !allowedMethods.includes(m));
      if (invalid.length > 0) {
        return res.status(400).json({ error: "Invalid payment method detected" });
      }
      finalPaymentMethods = paymentMethods;
    }

    const product = await Product.create({
      supplier: user.id,
      name,
      description,
      category,
      price,
      unit,
      stock,
      negotiable: negotiable ?? false,
      paymentMethods: finalPaymentMethods, // ✅ multiple with default
      status: "pending"
    });

    return res.json({ message: "Product submitted for review", product });

  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
};

export const getAllProductsForAdmin = async (req: Request, res: Response) => {
  try {
    const products = await Product.find()
      .populate("supplier", "name companyName phone averageRating verifiedSupplier");

    return res.json(products);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
};


/**
 * ================================
 *   GET PRODUCT BY ID (Public)
 * ================================
 */
export const getProductById = async (req: Request, res: Response) => {
  try {
    const id = req.params.id;
    const user = (req as any).user;
    const product = await Product.findById(id)
      .populate("supplier", "name companyName phone averageRating verifiedSupplier profileImage");

    if (!product) return res.status(404).json({ error: "Product not found" });

    // Allow supplier to view their own products regardless of status
    const isOwner = user && product.supplier && product.supplier._id.toString() === user.id;

    // only show approved for public users
    if (product.status !== "approved" && !isOwner) {
      return res.status(403).json({ error: "Product not approved yet" });
    }

    return res.json(product);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
};


/**
 * ================================
 *   GET ALL APPROVED PRODUCTS (Public)
 * ================================
 */
export const getAllProducts = async (req: Request, res: Response) => {
  try {
    const products = await Product.find({ status: "approved" })
      .populate("supplier", "name companyName phone averageRating verifiedSupplier");

    return res.json(products);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
};


/**
 * ================================
 *   GET MY PRODUCTS (Supplier Only)
 * ================================
 */
export const getMyProducts = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const products = await Product.find({ supplier: user.id });

    return res.json(products);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
};


/**
 * ================================
 *   UPDATE PRODUCT (Supplier Only)
 * ================================
 *  ❗ If product was approved, it stays approved after update
 */
export const updateProduct = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const productId = req.params.id;

    const oldProduct: any = await Product.findById(productId);
    if (!oldProduct) return res.status(404).json({ error: "Product not found" });

    if (oldProduct.supplier.toString() !== user.id) {
      return res.status(403).json({ error: "You cannot update this product" });
    }

    const allowedFields = ["name", "description", "category", "price", "unit", "stock", "negotiable"];
    const data: any = {};
    for (const key of allowedFields) {
      if (req.body[key] !== undefined) data[key] = req.body[key];
    }

    // Keep approved status if product was already approved
    if (oldProduct.status === "approved") {
      data.status = "approved";
    } else {
      data.status = "pending";
    }
    data.rejectionReason = null;

    const updated = await Product.findByIdAndUpdate(productId, data, { new: true }).lean();

    try {
      if (!updated) throw new Error("Updated product not found");

      if (oldProduct.price > updated.price) {
        await notifyWishlistUsers(updated, {
          type: "price_drop",
          oldPrice: oldProduct.price,
          newPrice: updated.price
        });
      }

      if (oldProduct.stock === 0 && updated.stock > 0) {
        await notifyWishlistUsers(updated, { type: "back_in_stock" });
      }
    } catch (notifyErr) {
      console.warn("Wishlist notification failed:", notifyErr);
    }

    const message = oldProduct.status === "approved"
      ? "Product updated successfully"
      : "Product updated, waiting for admin review";

    return res.json({
      message,
      product: updated
    });

  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
};


/**
 * ================================
 *   DELETE PRODUCT (Supplier Only)
 * ================================
 */
export const deleteProduct = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const productId = req.params.id;

    const product = await Product.findById(productId);
    if (!product) return res.status(404).json({ error: "Product not found" });

    if (product.supplier.toString() !== user.id) {
      return res.status(403).json({ error: "You cannot delete this product" });
    }

    await Product.findByIdAndDelete(productId);

    return res.json({ message: "Product deleted successfully" });

  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
};
/**
 * -------------------------------
 *  TOP RATED PRODUCTS (Public)
 * -------------------------------
 */
export const getTopRatedProducts = async (req: Request, res: Response) => {
  try {
    const limit = Number(req.query.limit) || 10;

    const products = await Product.find({ status: "approved" })
      .sort({ "rating.average": -1, "rating.count": -1 })
      .limit(limit)
      .select("name category price unit image images supplier stock rating")
      .populate("supplier", "name companyName verifiedSupplier");

    return res.json({ products });

  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
};
/**
 * -------------------------------
 *  SEARCH & FILTER PRODUCTS (Public)
 * -------------------------------
 */
export const searchProducts = async (req: Request, res: Response) => {
  try {
    const {
      q,
      category,
      negotiable,
      minPrice,
      maxPrice,
      supplierRating,
      verifiedSupplier,
      inStock,
      nearLat,
      nearLng,
      maxDistance = 15, // km default
      page = 1,
      limit = 12
    } = req.query;

    // Default: show only approved products
    const filter: any = { status: "approved" };

    // 🔍 Keyword search
    if (q) filter.name = { $regex: q as string, $options: "i" };

    // 📂 Category filter
    if (category) filter.category = category;

    // 🔄 Negotiable Filter
    if (negotiable === "true") filter.negotiable = true;

    // 💰 Price range
    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = Number(minPrice);
      if (maxPrice) filter.price.$lte = Number(maxPrice);
    }

    // 📦 Only products with stock > 0
    if (inStock === "true") filter.stock = { $gt: 0 };

    // ⭐ Supplier filters
    const supplierFilter: any = {};
    if (supplierRating) supplierFilter["rating.average"] = { $gte: Number(supplierRating) };
    if (verifiedSupplier === "true") supplierFilter.verifiedSupplier = true;

    const skip = (Number(page) - 1) * Number(limit);

    // ⚡ Find products with supplier data
    let products = await Product.find(filter)
      .populate({
        path: "supplier",
        select: "name companyName rating verifiedSupplier businessLocation",
        match: supplierFilter
      })
      .skip(skip)
      .limit(Number(limit))
      .lean();

    // Remove products with no supplier after filtering
    products = products.filter((p: any) => p.supplier);

    // 📍 Distance filter
    if (nearLat && nearLng) {
      const buyerLat = Number(nearLat);
      const buyerLng = Number(nearLng);

      products = products.filter((p: any) => {
        const coords = p?.supplier?.businessLocation?.coordinates;
        if (!coords?.lat || !coords?.lng) return false;

        const dist = getDistanceKm(buyerLat, buyerLng, coords.lat, coords.lng);
        return dist <= Number(maxDistance);
      });
    }

    return res.json({
      page: Number(page),
      total: products.length,
      pages: Math.ceil(products.length / Number(limit)),
      products
    });

  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
};

// 🧮 Haversine distance formula
const getDistanceKm = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 6371; // Earth radius km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};




