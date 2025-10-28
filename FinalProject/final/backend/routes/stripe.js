const express = require("express");
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const Order = require("../models/Order");
const Product = require("../models/Product");
const Cart = require("../models/Cart");
const { authenticate } = require("../middleware/auth");
const { body, validationResult } = require("express-validator");

const router = express.Router();

// Create payment intent
router.post(
  "/create-payment-intent",
  authenticate,
  [
    body("shippingAddress")
      .isObject()
      .withMessage("Shipping address is required"),
    body("billingAddress")
      .isObject()
      .withMessage("Billing address is required"),
    body("shippingCost")
      .isFloat({ min: 0 })
      .withMessage("Shipping cost must be a positive number"),
    body("taxAmount")
      .isFloat({ min: 0 })
      .withMessage("Tax amount must be a positive number"),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const {
        shippingAddress,
        billingAddress,
        shippingCost = 0,
        taxAmount = 0,
      } = req.body;

      // Get user's cart
      const cart = await Cart.findOne({ user: req.user._id }).populate(
        "items.product"
      );

      if (!cart || cart.items.length === 0) {
        return res.status(400).json({ message: "Cart is empty" });
      }

      // Validate all products are still available
      const unavailableProducts = [];
      let subtotal = 0;

      for (const item of cart.items) {
        const product = item.product;

        if (!product || product.status !== "active" || !product.isActive) {
          unavailableProducts.push({
            productId: item.product._id,
            name: product?.name || "Unknown Product",
            reason: "Product is no longer available",
          });
          continue;
        }

        if (
          product.stock.trackInventory &&
          product.stock.quantity < item.quantity
        ) {
          unavailableProducts.push({
            productId: item.product._id,
            name: product.name,
            reason: "Insufficient stock",
            availableStock: product.stock.quantity,
          });
          continue;
        }

        subtotal += item.price * item.quantity;
      }

      if (unavailableProducts.length > 0) {
        return res.status(400).json({
          message: "Some products are no longer available",
          unavailableProducts,
        });
      }

      const total = subtotal + shippingCost + taxAmount;

      // Create payment intent
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(total * 100), // Convert to cents
        currency: "usd",
        metadata: {
          userId: req.user._id.toString(),
          cartId: cart._id.toString(),
        },
      });

      // Store order information temporarily (you might want to use Redis for this)
      // For now, we'll create a pending order
      const orderData = {
        user: req.user._id,
        items: cart.items.map((item) => ({
          product: item.product._id,
          quantity: item.quantity,
          price: item.price,
          name: item.product.name,
          image: item.product.primaryImage,
        })),
        shippingAddress,
        billingAddress,
        subtotal,
        shippingCost,
        taxAmount,
        total,
        paymentMethod: "stripe",
        stripePaymentIntentId: paymentIntent.id,
        status: "pending",
      };

      const order = new Order(orderData);
      await order.save();

      res.json({
        clientSecret: paymentIntent.client_secret,
        orderId: order._id,
        total,
      });
    } catch (error) {
      console.error("Create payment intent error:", error);
      res
        .status(500)
        .json({ message: "Server error while creating payment intent" });
    }
  }
);

// Confirm payment and create order
router.post(
  "/confirm-payment",
  authenticate,
  [
    body("paymentIntentId")
      .notEmpty()
      .withMessage("Payment intent ID is required"),
    body("orderId").isMongoId().withMessage("Valid order ID is required"),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { paymentIntentId, orderId } = req.body;

      // Retrieve payment intent from Stripe
      const paymentIntent = await stripe.paymentIntents.retrieve(
        paymentIntentId
      );

      if (paymentIntent.status !== "succeeded") {
        return res.status(400).json({
          message: "Payment not successful",
          status: paymentIntent.status,
        });
      }

      // Find the order
      const order = await Order.findOne({
        _id: orderId,
        user: req.user._id,
        stripePaymentIntentId: paymentIntentId,
        status: "pending",
      });

      if (!order) {
        return res
          .status(404)
          .json({ message: "Order not found or already processed" });
      }

      // Update order status
      order.status = "confirmed";
      order.paymentStatus = "paid";
      order.stripeChargeId = paymentIntent.charges.data[0].id;
      await order.save();

      // Deduct stock from products
      for (const item of order.items) {
        try {
          await Product.findByIdAndUpdate(item.product, {
            $inc: {
              "stock.quantity": -item.quantity,
              salesCount: item.quantity,
            },
          });
        } catch (error) {
          console.error(
            `Error updating stock for product ${item.product}:`,
            error
          );
        }
      }

      // Clear user's cart
      const cart = await Cart.findOne({ user: req.user._id });
      if (cart) {
        await cart.clear();
      }

      res.json({
        message: "Payment confirmed and order created successfully",
        order: await Order.findById(order._id).populate("items.product"),
      });
    } catch (error) {
      console.error("Confirm payment error:", error);
      res
        .status(500)
        .json({ message: "Server error while confirming payment" });
    }
  }
);

// Stripe webhook handler
router.post(
  "/webhook",
  express.raw({ type: "application/json" }),
  async (req, res) => {
    const sig = req.headers["stripe-signature"];
    let event;

    try {
      event = stripe.webhooks.constructEvent(
        req.body,
        sig,
        process.env.STRIPE_WEBHOOK_SECRET
      );
    } catch (err) {
      console.error("Webhook signature verification failed:", err.message);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    // Handle the event
    switch (event.type) {
      case "payment_intent.succeeded":
        const paymentIntent = event.data.object;
        console.log("PaymentIntent succeeded:", paymentIntent.id);

        // Update order status if needed
        try {
          await Order.findOneAndUpdate(
            { stripePaymentIntentId: paymentIntent.id },
            {
              paymentStatus: "paid",
              status: "confirmed",
            }
          );
        } catch (error) {
          console.error("Error updating order from webhook:", error);
        }
        break;

      case "payment_intent.payment_failed":
        const failedPayment = event.data.object;
        console.log("PaymentIntent failed:", failedPayment.id);

        // Update order status
        try {
          await Order.findOneAndUpdate(
            { stripePaymentIntentId: failedPayment.id },
            {
              paymentStatus: "failed",
              status: "cancelled",
            }
          );
        } catch (error) {
          console.error("Error updating failed order from webhook:", error);
        }
        break;

      default:
        console.log(`Unhandled event type ${event.type}`);
    }

    res.json({ received: true });
  }
);

// Get payment methods (for future use)
router.get("/payment-methods", authenticate, async (req, res) => {
  try {
    // In a real implementation, you would store customer IDs
    // For now, we'll return empty array
    res.json({ paymentMethods: [] });
  } catch (error) {
    console.error("Get payment methods error:", error);
    res
      .status(500)
      .json({ message: "Server error while fetching payment methods" });
  }
});

module.exports = router;
