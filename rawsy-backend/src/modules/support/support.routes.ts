import { Router } from "express";
import { authenticate } from "../../middlewares/auth.middleware";
import { requireRole } from "../../middlewares/roles.middleware";

import { listFaqs, createFaq, updateFaq, deleteFaq } from "./faq.controller";
import { broadcastUpdate } from "./broadcast.controller";

const router = Router();

// 📌 FAQ (public)
router.get("/faq", listFaqs);

// 📌 Admin FAQ & Broadcast
router.post("/faq", authenticate, requireRole("admin"), createFaq);
router.put("/faq/:id", authenticate, requireRole("admin"), updateFaq);
router.delete("/faq/:id", authenticate, requireRole("admin"), deleteFaq);
router.post("/broadcast", authenticate, requireRole("admin"), broadcastUpdate);

export default router;
