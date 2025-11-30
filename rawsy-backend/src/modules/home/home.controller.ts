import { Request, Response } from "express";
import User from "../auth/auth.model";
import Product from "../products/product.model";
import Order from "../orders/order.model";
import QuoteRequest from "../quotes/quote.model";
import mongoose from "mongoose";

export const getManufacturerHome = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;

    const popularProducts = await User.aggregate([
      { $unwind: "$wishlist" },
      { $group: { _id: "$wishlist", wishlistCount: { $sum: 1 } } },
      { $sort: { wishlistCount: -1 } },
      { $limit: 6 }
    ]);

    const productIds = popularProducts.map((p: any) => p._id);
    const products = await Product.find({
      _id: { $in: productIds },
      status: "approved"
    })
      .populate("supplier", "name companyName verifiedSupplier averageRating")
      .select("name price unit images image category discount stock rating");

    const popularMaterials = popularProducts.map((p: any) => {
      const product = products.find((x: any) => x._id.toString() === p._id.toString());
      return product ? {
        _id: product._id,
        name: product.name,
        price: product.price,
        unit: product.unit,
        image: product.image || product.images?.[0],
        category: product.category,
        discount: product.discount,
        stock: product.stock,
        rating: product.rating,
        supplier: product.supplier,
        wishlistCount: p.wishlistCount
      } : null;
    }).filter(Boolean);

    const recommendedSuppliers = await User.find({
      role: "supplier",
      status: "approved",
      verifiedSupplier: true
    })
      .select("name companyName averageRating reviewCount verifiedSupplier profileImage")
      .sort({ averageRating: -1 })
      .limit(5);

    const categoryCounts = await Product.aggregate([
      { $match: { status: "approved" } },
      { $group: { _id: "$category", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 6 }
    ]);

    const trendingCategories = categoryCounts.map((c: any) => ({
      name: c._id,
      count: c.count
    }));

    const recentOrders = await Order.find({ buyer: userId })
      .populate("supplier", "name")
      .select("reference status total createdAt")
      .sort({ createdAt: -1 })
      .limit(3);

    return res.json({
      popularMaterials,
      recommendedSuppliers,
      trendingCategories,
      recentOrders
    });

  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
};

export const getSupplierDashboard = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
const objectUserId = new mongoose.Types.ObjectId(userId);
    const totalProducts = await Product.countDocuments({
      supplier: userId
    });

    const productStats = await Product.aggregate([
      { $match: { supplier: objectUserId} },
      {
        $group: {
          _id: { $toLower: "$status" },
          count: { $sum: 1 }
        }
      }
    ]);

    const stats: any = {
      total: totalProducts,
      approved: 0,
      pending: 0,
      rejected: 0
    };

    productStats.forEach((stat: any) => {
      stats[stat._id] = stat.count;
    });

    const totalOrders = await Order.countDocuments({ supplier: userId });

    const ordersByStatus = await Order.aggregate([
      { $match: { supplier: objectUserId } },
      {
        $group: {
          _id: { $toLower: "$status" },
          count: { $sum: 1 }
        }
      }
    ]);

    const ordersStats: any = {
      total: totalOrders,
      placed: 0,
      confirmed: 0,
      in_transit: 0,
      delivered: 0
    };

    ordersByStatus.forEach((stat: any) => {
      ordersStats[stat._id] = stat.count;
    });

    const revenueData = await Order.aggregate([
      {
        $match: {
          supplier: userId,
          status: "delivered"
        }
      },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: "$total" }
        }
      }
    ]);

    const totalRevenue = revenueData.length > 0 ? revenueData[0].totalRevenue : 0;

    const recentOrders = await Order.find({ supplier: userId })
      .populate("buyer", "name phone")
      .select("reference status total createdAt items")
      .sort({ createdAt: -1 })
      .limit(5);

    const pendingQuotes = await QuoteRequest.find({
      supplier: userId,
      status: "pending"
    })
      .populate("buyer", "name phone")
      .populate("product", "name unit")
      .select("quantityRequested productSnapshot createdAt notes")
      .sort({ createdAt: -1 })
      .limit(5);

    const rejectedProducts = await Product.find({
      supplier: userId,
      status: "rejected"
    })
      .select("name rejectionReason createdAt")
      .sort({ createdAt: -1 })
      .limit(3);

    const lowStockProducts = await Product.find({
      supplier: userId,
      status: "approved",
      stock: { $lte: 10, $gt: 0 }
    })
      .select("name stock unit")
      .sort({ stock: 1 })
      .limit(5);

    return res.json({
      overview: {
        totalProducts: stats.total,
        approvedProducts: stats.approved,
        pendingProducts: stats.pending,
        rejectedProducts: stats.rejected,
        totalOrders: ordersStats.total,
        activeOrders: ordersStats.placed + ordersStats.confirmed + ordersStats.in_transit,
        completedOrders: ordersStats.delivered,
        totalRevenue
      },
      recentOrders,
      pendingQuotes,
      rejectedProducts,
      lowStockProducts
    });

  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
};
