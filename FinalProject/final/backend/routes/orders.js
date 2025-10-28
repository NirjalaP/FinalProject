const express = require("express");
const Order = require("../models/Order");
const { authenticate, isAdmin } = require("../middleware/auth");
const { body, validationResult, query } = require("express-validator");

const router = express.Router();

// Get user's orders
router.get("/", authenticate, async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const filter = { user: req.user._id };
    if (status) {
      filter.status = status;
    }

    const orders = await Order.find(filter)
      .populate("items.product", "name slug images")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    const totalOrders = await Order.countDocuments(filter);
    const totalPages = Math.ceil(totalOrders / parseInt(limit));

    res.json({
      orders,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalOrders,
        hasNextPage: parseInt(page) < totalPages,
        hasPrevPage: parseInt(page) > 1,
      },
    });
  } catch (error) {
    console.error("Get orders error:", error);
    res.status(500).json({ message: "Server error while fetching orders" });
  }
});

// Get single order
router.get("/:orderId", authenticate, async (req, res) => {
  try {
    const { orderId } = req.params;

    const order = await Order.findOne({
      _id: orderId,
      user: req.user._id,
    }).populate("items.product", "name slug images");

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    res.json({ order });
  } catch (error) {
    console.error("Get order error:", error);
    res.status(500).json({ message: "Server error while fetching order" });
  }
});

// Cancel order (user only)
router.patch("/:orderId/cancel", authenticate, async (req, res) => {
  try {
    const { orderId } = req.params;

    const order = await Order.findOne({
      _id: orderId,
      user: req.user._id,
    });

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    if (order.status !== "pending" && order.status !== "confirmed") {
      return res.status(400).json({
        message: "Order cannot be cancelled in current status",
        currentStatus: order.status,
      });
    }

    order.status = "cancelled";
    await order.save();

    res.json({
      message: "Order cancelled successfully",
      order: {
        _id: order._id,
        orderNumber: order.orderNumber,
        status: order.status,
      },
    });
  } catch (error) {
    console.error("Cancel order error:", error);
    res.status(500).json({ message: "Server error while cancelling order" });
  }
});

// Admin routes
// Get all orders (admin)
router.get("/admin/all", authenticate, isAdmin, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      status,
      paymentStatus,
      startDate,
      endDate,
      search,
    } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Build filter
    const filter = {};
    if (status) filter.status = status;
    if (paymentStatus) filter.paymentStatus = paymentStatus;
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) filter.createdAt.$lte = new Date(endDate);
    }

    let orders;
    if (search) {
      // Search by order number or customer name
      orders = await Order.find({
        ...filter,
        $or: [
          { orderNumber: { $regex: search, $options: "i" } },
          { "shippingAddress.firstName": { $regex: search, $options: "i" } },
          { "shippingAddress.lastName": { $regex: search, $options: "i" } },
        ],
      })
        .populate("user", "firstName lastName email")
        .populate("items.product", "name slug")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean();
    } else {
      orders = await Order.find(filter)
        .populate("user", "firstName lastName email")
        .populate("items.product", "name slug")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean();
    }

    const totalOrders = await Order.countDocuments(filter);
    const totalPages = Math.ceil(totalOrders / parseInt(limit));

    res.json({
      orders,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalOrders,
        hasNextPage: parseInt(page) < totalPages,
        hasPrevPage: parseInt(page) > 1,
      },
    });
  } catch (error) {
    console.error("Get all orders error:", error);
    res.status(500).json({ message: "Server error while fetching orders" });
  }
});

// Update order status (admin)
router.patch(
  "/:orderId/status",
  authenticate,
  isAdmin,
  [
    body("status")
      .isIn([
        "pending",
        "confirmed",
        "processing",
        "shipped",
        "delivered",
        "cancelled",
        "returned",
      ])
      .withMessage("Invalid order status"),
    body("notes").optional().trim(),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { orderId } = req.params;
      const { status, notes } = req.body;

      const order = await Order.findById(orderId);
      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }

      await order.updateStatus(status, notes);

      res.json({
        message: "Order status updated successfully",
        order: {
          _id: order._id,
          orderNumber: order.orderNumber,
          status: order.status,
          adminNotes: order.adminNotes,
        },
      });
    } catch (error) {
      console.error("Update order status error:", error);
      res.status(500).json({
        message: "Server error while updating order status",
      });
    }
  }
);

// Add tracking information (admin)
router.patch(
  "/:orderId/tracking",
  authenticate,
  isAdmin,
  [
    body("trackingNumber")
      .trim()
      .notEmpty()
      .withMessage("Tracking number is required"),
    body("carrier").trim().notEmpty().withMessage("Carrier is required"),
    body("estimatedDelivery")
      .optional()
      .isISO8601()
      .withMessage("Invalid date format"),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { orderId } = req.params;
      const { trackingNumber, carrier, estimatedDelivery } = req.body;

      const order = await Order.findById(orderId);
      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }

      order.trackingNumber = trackingNumber;
      order.carrier = carrier;
      if (estimatedDelivery) {
        order.estimatedDelivery = new Date(estimatedDelivery);
      }

      await order.save();

      res.json({
        message: "Tracking information updated successfully",
        order: {
          _id: order._id,
          orderNumber: order.orderNumber,
          trackingNumber: order.trackingNumber,
          carrier: order.carrier,
          estimatedDelivery: order.estimatedDelivery,
        },
      });
    } catch (error) {
      console.error("Update tracking error:", error);
      res.status(500).json({
        message: "Server error while updating tracking information",
      });
    }
  }
);

// Get order statistics (admin)
router.get("/admin/statistics", authenticate, isAdmin, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    const stats = await Order.getStatistics(startDate, endDate);

    // Get additional statistics
    const statusStats = await Order.aggregate([
      ...(startDate || endDate
        ? [
            {
              $match: {
                createdAt: {
                  ...(startDate ? { $gte: new Date(startDate) } : {}),
                  ...(endDate ? { $lte: new Date(endDate) } : {}),
                },
              },
            },
          ]
        : []),
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
        },
      },
    ]);

    const paymentStats = await Order.aggregate([
      ...(startDate || endDate
        ? [
            {
              $match: {
                createdAt: {
                  ...(startDate ? { $gte: new Date(startDate) } : {}),
                  ...(endDate ? { $lte: new Date(endDate) } : {}),
                },
              },
            },
          ]
        : []),
      {
        $group: {
          _id: "$paymentStatus",
          count: { $sum: 1 },
        },
      },
    ]);

    // Recent orders
    const recentOrders = await Order.find()
      .populate("user", "firstName lastName")
      .populate("items.product", "name")
      .sort({ createdAt: -1 })
      .limit(5)
      .select("orderNumber status total createdAt user items")
      .lean();

    res.json({
      ...stats,
      statusBreakdown: statusStats,
      paymentBreakdown: paymentStats,
      recentOrders,
    });
  } catch (error) {
    console.error("Get order statistics error:", error);
    res.status(500).json({
      message: "Server error while fetching order statistics",
    });
  }
});

module.exports = router;


