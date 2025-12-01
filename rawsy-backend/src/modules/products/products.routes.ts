import { Router } from "express";
import { authenticate, optionalAuthenticate } from "../../middlewares/auth.middleware";
import { requireApprovedSupplier } from "../../middlewares/supplier.middleware";
import { createProduct,
  getAllProducts,
  getMyProducts,
  updateProduct,
  deleteProduct,
  getProductById,
  getTopRatedProducts,
  searchProducts,
  getAllProductsForAdmin } from "./product.controller";
import { uploadProductImage } from "./product.upload.controller";
import { uploadSingle } from "../../middlewares/upload.middleware";
import { deleteProductImage } from "./product.image.controller";
import { addProductReview, getProductReviews } from "./productReview.controller";
import { applyDiscount, removeDiscount } from "./product.discount.controller";
import { requireAdmin } from "../../middlewares/admin.middleware";
const router = Router();

// Supplier products list
router.get("/mine", authenticate, requireApprovedSupplier, getMyProducts);
router.get("/search/filter", searchProducts);
router.get("/top-rated", getTopRatedProducts);
router.get("/", getAllProducts);
router.get("/:id", optionalAuthenticate, getProductById);
// Protected route example: create product (supplier only)
router.post("/", authenticate, requireApprovedSupplier, createProduct);
router.put("/discount/add", authenticate, requireApprovedSupplier, applyDiscount);
router.put("/discount/remove/:productId", authenticate, requireApprovedSupplier, removeDiscount);

// Update product
router.put("/:id", authenticate, requireApprovedSupplier, updateProduct);
// Delete product
router.delete("/:id", authenticate, requireApprovedSupplier, deleteProduct);
router.post(
  "/:id/upload-image",
  authenticate,
  requireApprovedSupplier,
  (req, res, next) => uploadSingle("image")(req, res, (err) => {
    if (err) {
      // multer error handler
      return res.status(400).json({ error: err.message });
    }
    next();
  }),
  uploadProductImage
);
router.delete("/:id/image", authenticate, deleteProductImage);
// ⭐ ADD REVIEW to specific product
router.post(
  "/:productId/reviews",
  authenticate,
  addProductReview
);

// ⭐ GET REVIEWS of specific product
router.get(
  "/:productId/reviews",
  getProductReviews
);


export default router;
