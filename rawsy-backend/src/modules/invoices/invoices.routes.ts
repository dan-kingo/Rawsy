import { Router } from "express";
import { listInvoices } from "./invoices.controller";

const router = Router();

// GET /api/invoices - list available invoice PDFs
router.get("/", listInvoices);

export default router;
