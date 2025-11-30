import dotenv from "dotenv";
dotenv.config();
import express from "express";
import cors from "cors";
import { connectDB } from "./config/db";
import authRoutes from "./modules/auth/auth.routes";
import productsRoutes from "./modules/products/products.routes";
import adminRoutes  from "./modules/admin/admin.routes";
import orderRoutes from "./modules/orders/order.routes";
import deviceTokenRoutes from "./modules/auth/deviceToken.routes";
import notificationRoutes from "./modules/notifications/notification.routes";
import wishlistRoutes from "./modules/wishlist/wishlist.routes";
import cartRoutes from "./modules/cart/cart.routes";
import adminMetricsRoutes from "./modules/admin/admin.routes";
import reviewRoutes from "./modules/reviews/review.routes";
import quoteRoutes from "./modules/quotes/quote.routes";
import supportRoutes from "./modules/support/support.routes";
import homeRoutes from "./modules/home/home.routes";
import invoicesRoutes from "./modules/invoices/invoices.routes";
import path from "path";

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());
app.use("/api/auth", authRoutes);
app.use("/api/products", productsRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/auth", deviceTokenRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/wishlist", wishlistRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/admin", adminMetricsRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/quotes", quoteRoutes);
app.use("/api/support", supportRoutes);
app.use("/api/home", homeRoutes);
// Serve invoice files (static) - point to rawsy-backend/invoices from src
app.use("/invoices/files", express.static(path.resolve(__dirname, '../invoices')));
// API for invoice listing
app.use("/api/invoices", invoicesRoutes);
// Connect to MongoDB
connectDB();

// Default route (for health check)
app.get("/", (req, res) => {
  res.send("Rawsy backend is running...");
});


// Start server
app.listen(4000, "0.0.0.0", () => {
  console.log(`Server running on port ${process.env.PORT}`);
});
