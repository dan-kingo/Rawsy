import { Router } from "express";
import { authenticate } from "../../middlewares/auth.middleware";
import { requireRole } from "../../middlewares/roles.middleware";
import { approveSupplier, rejectSupplier, verifySupplier } from "./admin.controller";
import {
  getOverview,
  getTopSuppliers,
  getTopProducts,
  getTrends
} from "./admin.metrics.controller";
import { requireAdmin } from "../../middlewares/admin.middleware";
import { reviewProduct, toggleFlagProduct } from "./productModeration.controller";
import { getAllProductsForAdmin  } from "../products/product.controller";

const router = Router();

// 🟢 Approve supplier
router.put("/supplier/approve/:id", authenticate, requireRole("admin"), approveSupplier);
// admin.routes.ts
router.put("/products/:id/flag", authenticate, requireAdmin, toggleFlagProduct);

// ❌ Reject supplier
router.put("/supplier/reject/:id", authenticate, requireRole("admin"), rejectSupplier);

// ⭐ Verify supplier (trusted badge)
router.put("/supplier/verify/:id", authenticate, requireRole("admin"), verifySupplier);
router.put("/products/review/:id", authenticate, requireAdmin, reviewProduct);

router.get("/metrics/overview", authenticate, requireAdmin, getOverview);
router.get("/metrics/top-suppliers", authenticate, requireAdmin, getTopSuppliers);
router.get("/metrics/top-products", authenticate, requireAdmin, getTopProducts);
router.get("/metrics/trends", authenticate, requireAdmin, getTrends);
router.get("/products", authenticate, requireAdmin, getAllProductsForAdmin);

export default router;
