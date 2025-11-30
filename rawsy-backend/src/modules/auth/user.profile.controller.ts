import { Request, Response } from "express";
import User from "../auth/auth.model"; 
import cloudinary from "../../config/cloudinary.config";
import Product from "../products/product.model"; 

export const getMyProfile = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;

    const user = await User.findById(userId).select("-password -__v");

    if (!user) return res.status(404).json({ error: "User not found" });

    return res.json(user);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
};

export const updateMyProfile = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { name, phone, companyName, tinNumber, defaultAddress } = req.body;

    const updateData: any = {};

    if (name) updateData.name = name;
    if (phone) updateData.phone = phone;
    if (companyName) updateData.companyName = companyName;
    if (tinNumber) updateData.tinNumber = tinNumber;

    const updated = await User.findByIdAndUpdate(userId, updateData, { new: true })
      .select("-password -__v");

    return res.json({ message: "Profile updated", updated });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
};

export const uploadProfileImage = async (req: Request, res: Response) => {
  try {
    const file = (req as any).file;
    const userId = (req as any).user.id;

    if (!file) return res.status(400).json({ error: "No file uploaded" });

    const streamUpload = (buffer: Buffer) => {
      return new Promise<any>((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          { folder: "rawsy_profile" },
          (error, result) => {
            if (error) reject(error);
            resolve(result);
          }
        );
        stream.end(buffer);
      });
    };

    const result: any = await streamUpload(file.buffer);

    const updated = await User.findByIdAndUpdate(
      userId,
      { profileImage: result.secure_url },
      { new: true }
    ).select("-password -__v");

    return res.json({
      message: "Profile image updated",
      profileImage: result.secure_url,
      user: updated
    });

  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
};
export const getPublicUserProfile = async (req: Request, res: Response) => {
  try {
    const userId = req.params.id;

    const user: any = await User.findById(userId)
      .select("name phone companyName profileImage role averageRating reviewCount factoryLocation businessLocation companyDescription")
      .lean();

    if (!user) return res.status(404).json({ error: "User not found" });

    // Fetch sample products if supplier/manufacturer
    let products: any[] = [];
    if (user.role === "supplier") {
      products = await Product.find({ supplier: userId })
        .select("name price images rating stock")
        .limit(4)
        .lean();
    }

    // Present a friendly `description` property for the frontend (backwards compatible)
    if (user) user.description = user.companyDescription || '';

    return res.json({
      user,
      products
    });

  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
};