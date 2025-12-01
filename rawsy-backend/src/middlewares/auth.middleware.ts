import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import User from "../modules/auth/auth.model";
import RevokedToken from "../models/revokedToken.model";

const JWT_SECRET = process.env.JWT_SECRET || "supersecret";

export const authenticate = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = (req.headers.authorization || req.headers.Authorization) as string | undefined;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Authorization token missing" });
    }

    const token = authHeader.split(" ")[1];

    // 1) Check in revoked token blacklist
    const found = await RevokedToken.findOne({ token });
    if (found) {
      return res.status(401).json({ error: "Token revoked. Please login again." });
    }

    // 2) Verify JWT token
    const payload = jwt.verify(token, JWT_SECRET) as any; // { id, role, ... }

    // 3) Validate user still exists
    const user = await User.findById(payload.id).select("-password");
    if (!user) return res.status(401).json({ error: "Invalid token (user not found)" });

    // 4) Attach to request
    (req as any).user = {
      id: user._id.toString(),
      role: user.role,
      email: user.email,
      status: user.status
    };

    return next();
  } catch (err: any) {
    console.error("Auth middleware error:", err.message || err);
    return res.status(401).json({ error: "Invalid or expired token" });
  }
};

export const optionalAuthenticate = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = (req.headers.authorization || req.headers.Authorization) as string | undefined;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return next();
    }

    const token = authHeader.split(" ")[1];

    const found = await RevokedToken.findOne({ token });
    if (found) {
      return next();
    }

    const payload = jwt.verify(token, JWT_SECRET) as any;

    const user = await User.findById(payload.id).select("-password");
    if (user) {
      (req as any).user = {
        id: user._id.toString(),
        role: user.role,
        email: user.email,
        status: user.status
      };
    }

    return next();
  } catch (err: any) {
    return next();
  }
};
