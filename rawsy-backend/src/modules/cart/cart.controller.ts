import { Request, Response } from "express";
import User from "../auth/auth.model";
import Product from "../products/product.model";
import Order from "../orders/order.model";
import { saveNotification, sendPushNotification } from "../../services/notification.service";

/**
 * Add item to cart (single-supplier cart)
 */
export const addToCart = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { productId, quantity } = req.body;

    if (!productId || !quantity || quantity < 1) {
  return res.status(400).json({ error: "Valid product ID and quantity required" });
}

    const product = await Product.findById(productId);
    if (!product) return res.status(404).json({ error: "Product not found" });

    // Load the user with populated cart products
    const userData = await User.findById(user.id).populate("cart.product");
    if (!userData) return res.status(404).json({ error: "User not found" });

    // SINGLE SUPPLIER CART RULE
    if (userData.cart.length > 0) {
      const existingProduct: any = userData.cart[0].product; // populated

      if (!existingProduct || !existingProduct.supplier) {
        return res.status(500).json({ error: "Cart contains invalid product data" });
      }

      const existingSupplier = existingProduct.supplier.toString();
      const newSupplier = product.supplier.toString();

      if (existingSupplier !== newSupplier) {
        return res.status(400).json({
          error: "Cart contains items from another supplier. Clear cart first."
        });
      }
    }

    // If item already exists → update quantity
    const existingItem = userData.cart.find(
      (item: any) => item.product._id.toString() === productId
    );

    if (existingItem) {
      existingItem.quantity += quantity;
    } else {
      userData.cart.push({ product: productId, quantity });
    }

    await userData.save();

    return res.json({ message: "Added to cart", cart: userData.cart });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
};

/**
 * Remove an item from cart
 */
export const removeFromCart = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { productId } = req.body;

    if (!productId) {
      return res.status(400).json({ error: "Product ID required" });
    }

    const userData = await User.findByIdAndUpdate(
      user.id,
      {
        $pull: { cart: { product: productId } }
      },
      { new: true }
    ).populate("cart.product");

    if (!userData) return res.status(404).json({ error: "User not found" });

    return res.json({
      message: "Removed from cart",
      cart: userData.cart
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
};


/**
 * Update quantity for an item in cart
 */
export const updateCartQuantity = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { productId, quantity } = req.body;

    const userData = await User.findById(user.id).populate("cart.product");
    if (!userData) return res.status(404).json({ error: "User not found" });

    const item = userData.cart.find(
      (i: any) => i.product._id.toString() === productId
    );

    if (!item) return res.status(404).json({ error: "Item not in cart" });

    item.quantity = quantity;
    await userData.save();

    return res.json({ message: "Updated quantity", cart: userData.cart });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
};

/**
 * Get the current user's cart (with product details)
 */
export const getCart = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const data = await User.findById(user.id).populate("cart.product");
    return res.json({ cart: data?.cart || [] });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
};

/**
 * Optional: clear entire cart (helpful for checkout flow)
 */
export const clearCart = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;

    await User.findByIdAndUpdate(
      user.id,
      { $set: { cart: [] } }, // <-- this is the correct way
      { new: true }
    );

    return res.json({ message: "Cart cleared" });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
};
export const checkoutCart = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { delivery } = req.body;

    // load user with cart populated
    const userData = await User.findById(user.id).populate("cart.product");
    if (!userData) return res.status(404).json({ error: "User not found" });

    if (!userData.cart || userData.cart.length === 0) {
      return res.status(400).json({ error: "Cart is empty" });
    }

    // Determine if any product requires delivery
    const deliveryRequired = userData.cart.some((item: any) => {
      const prod: any = item.product;
      return prod.deliveryAvailable && prod.deliveryAllowed !== false; // manufacturer can disable delivery
    });

    let deliveryInfo = null;

    if (deliveryRequired) {
      // Use delivery override or defaultAddress
      deliveryInfo =
        delivery?.address && delivery.contactName && delivery.contactPhone
          ? delivery
          : userData.factoryLocation;

      if (!deliveryInfo?.address) {
        return res.status(400).json({
          error:
            "Delivery address required (set defaultAddress in profile or provide in checkout)"
        });
      }
    }

    // Determine supplier (single-supplier cart)
    const firstProduct: any = userData.cart[0].product;
    const finalPaymentMethod = "cash_on_delivery";
    if (!firstProduct || !firstProduct.supplier) {
      return res.status(500).json({ error: "Invalid product in cart" });
    }
    const supplierId = firstProduct.supplier.toString();


    // Build items and check stock for each product atomically
    const items: any[] = [];
    let total = 0;

    for (const entry of userData.cart) {
      const prod: any = entry.product;
      const qty: number = entry.quantity;

      const updated = await Product.findOneAndUpdate(
        { _id: prod._id, stock: { $gte: qty } },
        { $inc: { stock: -qty } },
        { new: true }
      );

      if (!updated) {
        // restore previously decremented stock for earlier items (best-effort)
        for (const done of items) {
          await Product.findByIdAndUpdate(done.product, { $inc: { stock: done.quantity } });
        }
        return res
          .status(400)
          .json({ error: `Insufficient stock for product ${prod._id} or product not found` });
      }

      // Calculate final price with discount
      let unitPrice = prod.price;
      if (prod.discount?.active && prod.discount.percentage > 0) {
        unitPrice = prod.price - (prod.price * prod.discount.percentage) / 100;
      }

      const subtotal = unitPrice * qty;
      total += subtotal;
      items.push({
        product: prod._id,
        name: prod.name,
        unitPrice,
        quantity: qty,
        unit: prod.unit,
        subtotal
      });
    }

    // Determine initial payment status
    let initialPaymentStatus = "pending";

    // create order
    const order = await Order.create({
      buyer: user.id,
      supplier: supplierId,
      items,
      total,
      paymentMethod: finalPaymentMethod,
      paymentStatus: initialPaymentStatus,
      delivery: deliveryInfo, // can be null if no delivery required
      status: "placed",
      stockReserved: true,
      reference: "RAW-" + Date.now(),
      deliveryTimeline: { placedAt: new Date() }
    });

    // clear cart
    await User.findByIdAndUpdate(user.id, { $set: { cart: [] } });

    // notifications & push omitted for brevity (keep as is)

    return res.json({ message: "Order created from cart", order });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
};
export const checkoutDirect = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { productId, quantity = 1, paymentMethod, delivery } = req.body;

    if (!productId) {
      return res.status(400).json({ error: "productId is required" });
    }

    const product: any = await Product.findById(productId);
    if (!product) return res.status(404).json({ error: "Product not found" });

    if (product.stock < quantity) {
      return res.status(400).json({ error: "Insufficient stock" });
    }

    // delivery check
    const deliveryRequired = product.deliveryAvailable && product.deliveryAllowed !== false;

    let deliveryInfo = null;

    if (deliveryRequired) {
      const userData = await User.findById(user.id);
      deliveryInfo =
        delivery?.address && delivery.contactName && delivery.contactPhone
          ? delivery
          : userData?.factoryLocation;

      if (!deliveryInfo?.address) {
        return res.status(400).json({ error: "Delivery address required" });
      }
    }

    const finalPaymentMethod = "cash_on_delivery";

    // reduce stock atomically
    const updated = await Product.findOneAndUpdate(
      { _id: product._id, stock: { $gte: quantity } },
      { $inc: { stock: -quantity } },
      { new: true }
    );

    if (!updated) {
      return res.status(400).json({ error: "Stock update failed" });
    }

    // build order - calculate final price with discount
    let unitPrice = product.price;
    if (product.discount?.active && product.discount.percentage > 0) {
      unitPrice = product.price - (product.price * product.discount.percentage) / 100;
    }
    const subtotal = unitPrice * quantity;
    const total = subtotal;

    const paymentStatus = "pending";

    const order = await Order.create({
      buyer: user.id,
      supplier: product.supplier.toString(),
      items: [
        {
          product: product._id,
          name: product.name,
          unitPrice,
          quantity,
          unit: product.unit,
          subtotal
        }
      ],
      total,
      paymentMethod: finalPaymentMethod,
      paymentStatus,
      delivery: deliveryInfo,
      status: "placed",
      stockReserved: true,
      reference: "RAW-" + Date.now(),
      deliveryTimeline: { placedAt: new Date() }
    });

    return res.json({ message: "Order created (Buy Now)", order });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
};

