const express = require("express");
const Category = require("../models/Category");
const { authenticate, isAdmin } = require("../middleware/auth");
const { body, validationResult } = require("express-validator");

const router = express.Router();

// Get all categories
router.get("/", async (req, res) => {
  try {
    const { includeInactive = false } = req.query;

    const filter = {};
    if (!includeInactive) {
      filter.isActive = true;
    }

    const categories = await Category.find(filter)
      .sort({ sortOrder: 1, name: 1 })
      .lean();

    res.json({ categories });
  } catch (error) {
    console.error("Get categories error:", error);
    res.status(500).json({ message: "Server error while fetching categories" });
  }
});

// Get single category by slug or ID
router.get("/:identifier", async (req, res) => {
  try {
    const { identifier } = req.params;

    let category;

    // Try to find by slug first, then by ID
    if (identifier.match(/^[a-z0-9-]+$/)) {
      category = await Category.findOne({ slug: identifier });
    } else {
      category = await Category.findById(identifier);
    }

    if (!category) {
      return res.status(404).json({ message: "Category not found" });
    }

    res.json({ category });
  } catch (error) {
    console.error("Get category error:", error);
    res.status(500).json({ message: "Server error while fetching category" });
  }
});

// Get category with product count
router.get("/:identifier/with-count", async (req, res) => {
  try {
    const { identifier } = req.params;

    let category;

    if (identifier.match(/^[a-z0-9-]+$/)) {
      category = await Category.findOne({ slug: identifier });
    } else {
      category = await Category.findById(identifier);
    }

    if (!category) {
      return res.status(404).json({ message: "Category not found" });
    }

    // Get product count for this category
    const Product = require("../models/Product");
    const productCount = await Product.countDocuments({
      category: category._id,
      status: "active",
    });

    res.json({
      category,
      productCount,
    });
  } catch (error) {
    console.error("Get category with count error:", error);
    res
      .status(500)
      .json({ message: "Server error while fetching category with count" });
  }
});

// Admin routes (protected)
// Create new category
router.post(
  "/",
  authenticate,
  isAdmin,
  [
    body("name")
      .trim()
      .isLength({ min: 1 })
      .withMessage("Category name is required"),
    body("description").optional().trim(),
    body("nepaliName").optional().trim(),
    body("sortOrder").optional().isInt({ min: 0 }),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const category = new Category(req.body);
      await category.save();

      res.status(201).json({
        message: "Category created successfully",
        category,
      });
    } catch (error) {
      console.error("Create category error:", error);
      if (error.code === 11000) {
        return res
          .status(400)
          .json({ message: "Category with this name already exists" });
      }
      res.status(500).json({ message: "Server error while creating category" });
    }
  }
);

// Update category
router.put(
  "/:id",
  authenticate,
  isAdmin,
  [
    body("name").optional().trim().isLength({ min: 1 }),
    body("description").optional().trim(),
    body("nepaliName").optional().trim(),
    body("sortOrder").optional().isInt({ min: 0 }),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const category = await Category.findByIdAndUpdate(
        req.params.id,
        req.body,
        { new: true, runValidators: true }
      );

      if (!category) {
        return res.status(404).json({ message: "Category not found" });
      }

      res.json({
        message: "Category updated successfully",
        category,
      });
    } catch (error) {
      console.error("Update category error:", error);
      if (error.code === 11000) {
        return res
          .status(400)
          .json({ message: "Category with this name already exists" });
      }
      res.status(500).json({ message: "Server error while updating category" });
    }
  }
);

// Delete category
router.delete("/:id", authenticate, isAdmin, async (req, res) => {
  try {
    // Check if category has products
    const Product = require("../models/Product");
    const productCount = await Product.countDocuments({
      category: req.params.id,
    });

    if (productCount > 0) {
      return res.status(400).json({
        message: "Cannot delete category with existing products",
        productCount,
      });
    }

    const category = await Category.findByIdAndDelete(req.params.id);

    if (!category) {
      return res.status(404).json({ message: "Category not found" });
    }

    res.json({ message: "Category deleted successfully" });
  } catch (error) {
    console.error("Delete category error:", error);
    res.status(500).json({ message: "Server error while deleting category" });
  }
});

// Toggle category status
router.patch("/:id/toggle-status", authenticate, isAdmin, async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);

    if (!category) {
      return res.status(404).json({ message: "Category not found" });
    }

    category.isActive = !category.isActive;
    await category.save();

    res.json({
      message: `Category ${
        category.isActive ? "activated" : "deactivated"
      } successfully`,
      category: {
        _id: category._id,
        name: category.name,
        isActive: category.isActive,
      },
    });
  } catch (error) {
    console.error("Toggle category status error:", error);
    res
      .status(500)
      .json({ message: "Server error while toggling category status" });
  }
});

module.exports = router;
