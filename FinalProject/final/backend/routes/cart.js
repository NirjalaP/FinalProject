const express = require("express");
const Cart = require("../models/Cart");
const Product = require("../models/Product");
const { authenticate, optionalAuth } = require("../middleware/auth");
const { body, validationResult } = require("express-validator");

const router = express.Router();

// Get user's cart
router.get("/", authenticate, async (req, res) => {
  try {
    const cart = await Cart.findOne({ user: req.user._id }).populate({
      path: "items.product",
      select: "name price images slug stock status isActive",
      populate: {
        path: "category",
        select: "name slug",
      },
    });

    if (!cart) {
      return res.json({
        cart: {
          items: [],
          totalItems: 0,
          totalPrice: 0,
        },
      });
    }

    // Filter out inactive or out-of-stock products
    const validItems = cart.items.filter((item) => {
      const product = item.product;
      return (
        product &&
        product.isActive &&
        product.status === "active" &&
        (product.stock.trackInventory ? product.stock.quantity > 0 : true)
      );
    });

    // Update cart with valid items only
    if (validItems.length !== cart.items.length) {
      cart.items = validItems;
      await cart.save();
    }

    res.json({ cart });
  } catch (error) {
    console.error("Get cart error:", error);
    res.status(500).json({ message: "Server error while fetching cart" });
  }
});

// Add item to cart
router.post(
  "/add",
  authenticate,
  [
    body("productId").isMongoId().withMessage("Valid product ID is required"),
    body("quantity")
      .isInt({ min: 1, max: 100 })
      .withMessage("Quantity must be between 1 and 100"),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { productId, quantity } = req.body;

      // Find the product
      const product = await Product.findById(productId);
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }

      if (product.status !== "active" || !product.isActive) {
        return res.status(400).json({ message: "Product is not available" });
      }

      // Check stock availability
      if (product.stock.trackInventory && product.stock.quantity < quantity) {
        return res.status(400).json({
          message: "Insufficient stock",
          availableStock: product.stock.quantity,
        });
      }

      // Find or create cart
      let cart = await Cart.findOne({ user: req.user._id });
      if (!cart) {
        cart = new Cart({ user: req.user._id, items: [] });
      }

      // Check if item already exists in cart
      const existingItemIndex = cart.items.findIndex(
        (item) => item.product.toString() === productId
      );

      if (existingItemIndex > -1) {
        // Update quantity
        const newQuantity = cart.items[existingItemIndex].quantity + quantity;

        // Check stock again for updated quantity
        if (
          product.stock.trackInventory &&
          product.stock.quantity < newQuantity
        ) {
          return res.status(400).json({
            message: "Insufficient stock for requested quantity",
            availableStock: product.stock.quantity,
            currentQuantity: cart.items[existingItemIndex].quantity,
          });
        }

        cart.items[existingItemIndex].quantity = newQuantity;
        cart.items[existingItemIndex].price = product.price;
      } else {
        // Add new item
        cart.items.push({
          product: productId,
          quantity: quantity,
          price: product.price,
        });
      }

      await cart.save();
      await cart.populate({
        path: "items.product",
        select: "name price images slug stock status isActive",
        populate: {
          path: "category",
          select: "name slug",
        },
      });

      res.json({
        message: "Item added to cart successfully",
        cart,
      });
    } catch (error) {
      console.error("Add to cart error:", error);
      res
        .status(500)
        .json({ message: "Server error while adding item to cart" });
    }
  }
);

// Update item quantity in cart
router.put(
  "/update/:productId",
  authenticate,
  [
    body("quantity")
      .isInt({ min: 0, max: 100 })
      .withMessage("Quantity must be between 0 and 100"),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { productId } = req.params;
      const { quantity } = req.body;

      const cart = await Cart.findOne({ user: req.user._id });
      if (!cart) {
        return res.status(404).json({ message: "Cart not found" });
      }

      const itemIndex = cart.items.findIndex(
        (item) => item.product.toString() === productId
      );

      if (itemIndex === -1) {
        return res.status(404).json({ message: "Item not found in cart" });
      }

      if (quantity === 0) {
        // Remove item from cart
        cart.items.splice(itemIndex, 1);
      } else {
        // Update quantity
        const product = await Product.findById(productId);
        if (!product) {
          return res.status(404).json({ message: "Product not found" });
        }

        // Check stock availability
        if (product.stock.trackInventory && product.stock.quantity < quantity) {
          return res.status(400).json({
            message: "Insufficient stock",
            availableStock: product.stock.quantity,
          });
        }

        cart.items[itemIndex].quantity = quantity;
        cart.items[itemIndex].price = product.price;
      }

      await cart.save();
      await cart.populate({
        path: "items.product",
        select: "name price images slug stock status isActive",
        populate: {
          path: "category",
          select: "name slug",
        },
      });

      res.json({
        message: "Cart updated successfully",
        cart,
      });
    } catch (error) {
      console.error("Update cart error:", error);
      res.status(500).json({ message: "Server error while updating cart" });
    }
  }
);

// Remove item from cart
router.delete("/remove/:productId", authenticate, async (req, res) => {
  try {
    const { productId } = req.params;

    const cart = await Cart.findOne({ user: req.user._id });
    if (!cart) {
      return res.status(404).json({ message: "Cart not found" });
    }

    const itemIndex = cart.items.findIndex(
      (item) => item.product.toString() === productId
    );

    if (itemIndex === -1) {
      return res.status(404).json({ message: "Item not found in cart" });
    }

    cart.items.splice(itemIndex, 1);
    await cart.save();
    await cart.populate({
      path: "items.product",
      select: "name price images slug stock status isActive",
      populate: {
        path: "category",
        select: "name slug",
      },
    });

    res.json({
      message: "Item removed from cart successfully",
      cart,
    });
  } catch (error) {
    console.error("Remove from cart error:", error);
    res
      .status(500)
      .json({ message: "Server error while removing item from cart" });
  }
});

// Clear entire cart
router.delete("/clear", authenticate, async (req, res) => {
  try {
    const cart = await Cart.findOne({ user: req.user._id });
    if (!cart) {
      return res.status(404).json({ message: "Cart not found" });
    }

    await cart.clear();

    res.json({
      message: "Cart cleared successfully",
      cart: {
        items: [],
        totalItems: 0,
        totalPrice: 0,
      },
    });
  } catch (error) {
    console.error("Clear cart error:", error);
    res.status(500).json({ message: "Server error while clearing cart" });
  }
});

// Get cart count (for header display)
router.get("/count", authenticate, async (req, res) => {
  try {
    const cart = await Cart.findOne({ user: req.user._id });
    const count = cart ? cart.totalItems : 0;

    res.json({ count });
  } catch (error) {
    console.error("Get cart count error:", error);
    res.status(500).json({ message: "Server error while fetching cart count" });
  }
});

// Merge guest cart with user cart (for when user logs in)
router.post(
  "/merge",
  authenticate,
  [
    body("guestCartItems")
      .isArray()
      .withMessage("Guest cart items must be an array"),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { guestCartItems } = req.body;

      // Find or create user cart
      let cart = await Cart.findOne({ user: req.user._id });
      if (!cart) {
        cart = new Cart({ user: req.user._id, items: [] });
      }

      // Process each guest cart item
      for (const guestItem of guestCartItems) {
        const { productId, quantity } = guestItem;

        // Verify product exists and is available
        const product = await Product.findById(productId);
        if (!product || product.status !== "active" || !product.isActive) {
          continue; // Skip invalid products
        }

        // Check stock
        if (product.stock.trackInventory && product.stock.quantity < quantity) {
          continue; // Skip if insufficient stock
        }

        // Check if item already exists in user cart
        const existingItemIndex = cart.items.findIndex(
          (item) => item.product.toString() === productId
        );

        if (existingItemIndex > -1) {
          // Merge quantities
          cart.items[existingItemIndex].quantity += quantity;
          cart.items[existingItemIndex].price = product.price;
        } else {
          // Add new item
          cart.items.push({
            product: productId,
            quantity: quantity,
            price: product.price,
          });
        }
      }

      await cart.save();
      await cart.populate({
        path: "items.product",
        select: "name price images slug stock status isActive",
        populate: {
          path: "category",
          select: "name slug",
        },
      });

      res.json({
        message: "Guest cart merged successfully",
        cart,
      });
    } catch (error) {
      console.error("Merge cart error:", error);
      res.status(500).json({ message: "Server error while merging cart" });
    }
  }
);

module.exports = router;
