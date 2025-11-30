import { Router } from "express";
import { authenticate } from "../../middlewares/auth.middleware";
import { requireRole } from "../../middlewares/roles.middleware";
import { checkoutCart } from "./cart.controller";

import {
  addToCart,
  removeFromCart,
  updateCartQuantity,
  getCart,
  clearCart,
  checkoutDirect
} from "./cart.controller";

const router = Router();

// Only manufacturers (buyers) should access cart routes
router.use(authenticate, requireRole("manufacturer"));

router.post("/add", addToCart);
router.post("/remove", removeFromCart);
router.post("/update", updateCartQuantity);
router.get("/list", getCart);
router.post("/clear", clearCart);
router.post("/checkout", checkoutCart);
router.post("/checkout-direct", checkoutDirect);
export default router;
