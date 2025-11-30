import { Request, Response } from "express";
import fs from "fs";
import path from "path";

// Resolve to the repo's rawsy-backend/invoices folder
const INVOICES_DIR = path.resolve(__dirname, "../../../invoices");

export const listInvoices = async (req: Request, res: Response) => {
  try {
    // List files in invoices directory
    if (!fs.existsSync(INVOICES_DIR)) return res.json([]);

    const files = fs.readdirSync(INVOICES_DIR)
      .filter((f) => f.toLowerCase().endsWith('.pdf'))
      .map((filename) => {
        // Serve files via /invoices/files/:filename (registered in server.ts)
        return {
          filename,
          url: `${req.protocol}://${req.get('host')}/invoices/files/${encodeURIComponent(filename)}`,
        };
      });

    return res.json(files);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
};
