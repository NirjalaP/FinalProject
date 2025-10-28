const express = require("express");
const Product = require("../models/Product");
const Category = require("../models/Category");
const { authenticate, isAdmin, optionalAuth } = require("../middleware/auth");
const { body, validationResult, query } = require("express-validator");

const router = express.Router();

// Get all products with filtering, sorting, and pagination
router.get(
  "/",
  [
    query("page").optional().isInt({ min: 1 }),
    query("limit").optional().isInt({ min: 1, max: 100 }),
    query("sort").optional().isIn(["name", "price", "createdAt", "salesCount"]),
    query("order").optional().isIn(["asc", "desc"]),
    query("category").optional().isMongoId(),
    query("minPrice").optional().isFloat({ min: 0 }),
    query("maxPrice").optional().isFloat({ min: 0 }),
    query("status").optional().isIn(["active", "inactive"]),
    query("featured").optional().isBoolean(),
    query("search").optional().isLength({ min: 1 }),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const {
        page = 1,
        limit = 12,
        sort = "createdAt",
        order = "desc",
        category,
        minPrice,
        maxPrice,
        status = "active",
        featured,
        search,
      } = req.query;

      // Build filter object
      const filter = { status };

      if (category) {
        filter.category = category;
      }

      if (featured !== undefined) {
        filter.isFeatured = featured === "true";
      }

      if (minPrice || maxPrice) {
        filter.price = {};
        if (minPrice) filter.price.$gte = parseFloat(minPrice);
        if (maxPrice) filter.price.$lte = parseFloat(maxPrice);
      }

      if (search) {
        filter.$text = { $search: search };
      }

      // Build sort object
      const sortOrder = order === "asc" ? 1 : -1;
      const sortObj = {};
      sortObj[sort] = sortOrder;

      // Calculate pagination
      const skip = (parseInt(page) - 1) * parseInt(limit);

      // Execute query with population
      const products = await Product.find(filter)
        .populate("category", "name slug")
        .sort(sortObj)
        .skip(skip)
        .limit(parseInt(limit))
        .lean();

      // Get total count for pagination
      const totalProducts = await Product.countDocuments(filter);
      const totalPages = Math.ceil(totalProducts / parseInt(limit));

      // Increment view count for each product (optional auth)
      if (req.user) {
        await Product.updateMany(
          { _id: { $in: products.map((p) => p._id) } },
          { $inc: { viewCount: 1 } }
        );
      }

      res.json({
        products,
        pagination: {
          currentPage: parseInt(page),
          totalPages,
          totalProducts,
          hasNextPage: parseInt(page) < totalPages,
          hasPrevPage: parseInt(page) > 1,
        },
      });
    } catch (error) {
      console.error("Get products error:", error);
      res.status(500).json({ message: "Server error while fetching products" });
    }
  }
);

// Get single product by slug or ID
router.get("/:identifier", async (req, res) => {
  try {
    const { identifier } = req.params;

    let product;

    // Try to find by slug first, then by ID
    if (identifier.match(/^[a-z0-9-]+$/)) {
      product = await Product.findOne({ slug: identifier }).populate(
        "category",
        "name slug nepaliName"
      );
    } else {
      product = await Product.findById(identifier).populate(
        "category",
        "name slug nepaliName"
      );
    }

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    // Increment view count if user is authenticated
    if (req.user) {
      product.viewCount += 1;
      await product.save();
    }

    res.json({ product });
  } catch (error) {
    console.error("Get product error:", error);
    res.status(500).json({ message: "Server error while fetching product" });
  }
});

// Get featured products
router.get("/featured/list", async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 8;

    const featuredProducts = await Product.find({
      isFeatured: true,
      status: "active",
    })
      .populate("category", "name slug")
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    res.json({ products: featuredProducts });
  } catch (error) {
    console.error("Get featured products error:", error);
    res
      .status(500)
      .json({ message: "Server error while fetching featured products" });
  }
});

// Get products by category
router.get("/category/:categorySlug", async (req, res) => {
  try {
    const { categorySlug } = req.params;
    const {
      page = 1,
      limit = 12,
      sort = "createdAt",
      order = "desc",
    } = req.query;

    // Find category by slug
    const category = await Category.findOne({ slug: categorySlug });
    if (!category) {
      return res.status(404).json({ message: "Category not found" });
    }

    // Build sort object
    const sortOrder = order === "asc" ? 1 : -1;
    const sortObj = {};
    sortObj[sort] = sortOrder;

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const products = await Product.find({
      category: category._id,
      status: "active",
    })
      .populate("category", "name slug")
      .sort(sortObj)
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    const totalProducts = await Product.countDocuments({
      category: category._id,
      status: "active",
    });

    const totalPages = Math.ceil(totalProducts / parseInt(limit));

    res.json({
      category,
      products,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalProducts,
        hasNextPage: parseInt(page) < totalPages,
        hasPrevPage: parseInt(page) > 1,
      },
    });
  } catch (error) {
    console.error("Get products by category error:", error);
    res
      .status(500)
      .json({ message: "Server error while fetching products by category" });
  }
});

// Search products
router.get(
  "/search/query",
  [
    query("q").isLength({ min: 1 }).withMessage("Search query is required"),
    query("page").optional().isInt({ min: 1 }),
    query("limit").optional().isInt({ min: 1, max: 100 }),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { q: query, page = 1, limit = 12 } = req.query;
      const skip = (parseInt(page) - 1) * parseInt(limit);

      const products = await Product.find(
        {
          $text: { $search: query },
          status: "active",
        },
        {
          score: { $meta: "textScore" },
        }
      )
        .populate("category", "name slug")
        .sort({ score: { $meta: "textScore" } })
        .skip(skip)
        .limit(parseInt(limit))
        .lean();

      const totalProducts = await Product.countDocuments({
        $text: { $search: query },
        status: "active",
      });

      const totalPages = Math.ceil(totalProducts / parseInt(limit));

      res.json({
        query,
        products,
        pagination: {
          currentPage: parseInt(page),
          totalPages,
          totalProducts,
          hasNextPage: parseInt(page) < totalPages,
          hasPrevPage: parseInt(page) > 1,
        },
      });
    } catch (error) {
      console.error("Search products error:", error);
      res
        .status(500)
        .json({ message: "Server error while searching products" });
    }
  }
);

// Admin routes (protected)
// Create new product
router.post(
  "/",
  authenticate,
  isAdmin,
  [
    body("name")
      .trim()
      .isLength({ min: 1 })
      .withMessage("Product name is required"),
    body("description")
      .trim()
      .isLength({ min: 10 })
      .withMessage("Description must be at least 10 characters"),
    body("category").isMongoId().withMessage("Valid category is required"),
    body("price")
      .isFloat({ min: 0 })
      .withMessage("Price must be a positive number"),
    body("stock.quantity")
      .isInt({ min: 0 })
      .withMessage("Stock quantity must be a non-negative integer"),
    body("sku").optional().trim(),
    body("barcode").optional().trim(),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const product = new Product(req.body);
      await product.save();
      await product.populate("category", "name slug");

      res.status(201).json({
        message: "Product created successfully",
        product,
      });
    } catch (error) {
      console.error("Create product error:", error);
      res.status(500).json({ message: "Server error while creating product" });
    }
  }
);

// Update product
router.put(
  "/:id",
  authenticate,
  isAdmin,
  [
    body("name").optional().trim().isLength({ min: 1 }),
    body("description").optional().trim().isLength({ min: 10 }),
    body("category").optional().isMongoId(),
    body("price").optional().isFloat({ min: 0 }),
    body("stock.quantity").optional().isInt({ min: 0 }),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const product = await Product.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true,
      }).populate("category", "name slug");

      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }

      res.json({
        message: "Product updated successfully",
        product,
      });
    } catch (error) {
      console.error("Update product error:", error);
      res.status(500).json({ message: "Server error while updating product" });
    }
  }
);

// Delete product
router.delete("/:id", authenticate, isAdmin, async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    res.json({ message: "Product deleted successfully" });
  } catch (error) {
    console.error("Delete product error:", error);
    res.status(500).json({ message: "Server error while deleting product" });
  }
});

// Update product stock
router.patch(
  "/:id/stock",
  authenticate,
  isAdmin,
  [
    body("quantity")
      .isInt({ min: 0 })
      .withMessage("Stock quantity must be a non-negative integer"),
    body("operation")
      .isIn(["set", "add", "subtract"])
      .withMessage("Operation must be set, add, or subtract"),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { quantity, operation } = req.body;
      const product = await Product.findById(req.params.id);

      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }

      switch (operation) {
        case "set":
          product.stock.quantity = quantity;
          break;
        case "add":
          product.stock.quantity += quantity;
          break;
        case "subtract":
          if (product.stock.quantity < quantity) {
            return res.status(400).json({ message: "Insufficient stock" });
          }
          product.stock.quantity -= quantity;
          break;
      }

      await product.save();

      res.json({
        message: "Stock updated successfully",
        product: {
          _id: product._id,
          name: product.name,
          stock: product.stock,
        },
      });
    } catch (error) {
      console.error("Update stock error:", error);
      res.status(500).json({ message: "Server error while updating stock" });
    }
  }
);

module.exports = router;
