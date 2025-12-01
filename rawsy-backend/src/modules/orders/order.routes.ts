import { Router } from "express";
import { authenticate } from "../../middlewares/auth.middleware";
import { requireApprovedSupplier } from "../../middlewares/supplier.middleware";
import { placeOrder,
    acceptOrder,
    rejectOrder,
    markOrderShipped,
    markOrderDelivered,
    getMyOrders,
    getSupplierOrders,
    getAllOrdersAdmin,
    filterOrdersAdmin,
    cancelOrder,
    downloadBuyerInvoice,
    downloadSupplierInvoice,
    getOrderTimeline,
  getOrderActivityLogs,
  getOrderStatus,
  getOrderTracking,
  getTrackingList,
  getOrderTrackingDetails,
  getBuyerInvoiceUrl,
  getSupplierInvoiceUrl } from "./order.controller";
import { requireAdmin } from "../../middlewares/admin.middleware";
import { requireRole } from "../../middlewares/roles.middleware";
import { blockSuspendedUsers } from "../../middlewares/blockSuspended.middleware";
import { getOrderAnalytics } from "./admin.order.analytics";
import { getInvoiceSummary, getMyInvoices, getSupplierInvoices, getAllInvoicesAdmin } from "./order.invoice.summary";
const router = Router();

// Supplier accepts order
router.put("/:id/accept", authenticate, requireApprovedSupplier, acceptOrder);
// Supplier rejects order
router.put("/:id/reject", authenticate, requireApprovedSupplier, rejectOrder);
// Supplier marks order as shipped
router.put("/:id/ship", authenticate, requireApprovedSupplier, markOrderShipped);
// Supplier marks order as delivered
router.put("/:id/deliver", authenticate, requireApprovedSupplier, markOrderDelivered);
// Buyer order history
router.get("/my-orders", authenticate, getMyOrders);
// Supplier order list
router.get("/supplier-orders", authenticate, requireApprovedSupplier, getSupplierOrders);
// Admin view all orders
router.get("/admin", authenticate, requireAdmin, getAllOrdersAdmin);
// filter orders (admin)
router.get("/admin/filter", authenticate, requireAdmin, filterOrdersAdmin);
// Buyer cancels order
router.put("/:id/cancel", authenticate, cancelOrder);
router.get("/:id/timeline", authenticate, getOrderTimeline);
// Download invoice
router.get("/:id/invoice/buyer", authenticate, downloadBuyerInvoice);
router.get("/:id/invoice/supplier", authenticate, downloadSupplierInvoice);
// Return authenticated JSON URLs for invoices (frontend will open these URLs)
router.get('/:id/invoice/buyer/url', authenticate, getBuyerInvoiceUrl);
router.get('/:id/invoice/supplier/url', authenticate, getSupplierInvoiceUrl);
router.post(
  "/",
  authenticate,
  blockSuspendedUsers,
  requireRole("manufacturer"),
  placeOrder
);
router.get("/:id/activity-logs", authenticate, getOrderActivityLogs);
router.get("/:id/status", authenticate, getOrderStatus);
router.get("/admin/analytics", authenticate, requireAdmin, getOrderAnalytics);
router.get("/:id/invoice-summary", authenticate, getInvoiceSummary);
router.get("/invoices/my", authenticate, requireRole("manufacturer"), getMyInvoices)
router.get(
  "/invoices/supplier",
  authenticate,
  requireRole("supplier"),
  getSupplierInvoices
);
router.get(
  "/invoices/admin",
  authenticate,
  requireAdmin,
  getAllInvoicesAdmin
);
router.get("/:id/tracking", authenticate, getOrderTracking);
router.get(
  "/tracking/list",
  authenticate,
  getTrackingList
);
router.get("/tracking/details/:orderId", authenticate, getOrderTrackingDetails);

export default router;
