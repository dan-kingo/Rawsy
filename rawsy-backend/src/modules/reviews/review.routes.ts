import { Router } from "express";
import { authenticate } from "../../middlewares/auth.middleware";
import { submitReview, listSupplierReviews, supplierRatingSummary, myReviews } from "./review.controller";

const router = Router();

// POST a review for an order (manufacturer only)
router.post("/:orderId", authenticate, submitReview);

// Public-ish: list reviews for a supplier (auth optional but we keep authenticate for now)
router.get("/supplier/:supplierId", authenticate, listSupplierReviews);

// summary for supplier (for list UI)
router.get("/supplier/:supplierId/summary", authenticate, supplierRatingSummary);
router.get("/my", authenticate, myReviews);
export default router;
