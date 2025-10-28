const express = require("express");
const multer = require("multer");
const cloudinary = require("cloudinary").v2;
const streamifier = require("streamifier");
const fs = require("fs");
const path = require("path");
const sharp = require("sharp");
const User = require("../models/User");
const Product = require("../models/Product");
const Category = require("../models/Category");
const Order = require("../models/Order");
const { authenticate, isAdmin } = require("../middleware/auth");

// Configure multer for memory storage
const upload = multer();

// Local product images directory (served from /assets/products)
const productImagesDir = path.join(__dirname, "..", "public", "assets", "products");
// Create product image directories if they don't exist
const imageDirs = {
  original: productImagesDir,
  large: path.join(productImagesDir, "large"),
  medium: path.join(productImagesDir, "medium"),
  thumb: path.join(productImagesDir, "thumb")
};

for (const dir of Object.values(imageDirs)) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function slugify(text) {
  return text
    .toString()
    .toLowerCase()
    .replace(/[^a-z0-9 -]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+/, "")
    .replace(/-+$/, "");
}

function getExtFromFilename(filename, mimetype) {
  const ext = path.extname(filename || "").toLowerCase();
  if (ext) return ext;
  if (!mimetype) return ".jpg";
  if (mimetype.includes("png")) return ".png";
  if (mimetype.includes("webp")) return ".webp";
  return ".jpg";
}

async function saveUploadedFiles(files, slug) {
  // files: array of { originalname, buffer, mimetype }
  const saved = [];
  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const ext = getExtFromFilename(file.originalname, file.mimetype);
    const filename = files.length === 1 ? `${slug}${ext}` : `${slug}-${i + 1}${ext}`;
    
    // Save original
    const originalDest = path.join(imageDirs.original, filename);
    try {
      await fs.promises.writeFile(originalDest, file.buffer);
      
      // Generate optimized versions using Sharp
      const image = sharp(file.buffer);
      
      // Large version (1200px wide, JPEG quality 80)
      await image
        .clone()
        .resize(1200, null, { withoutEnlargement: true })
        .jpeg({ quality: 80 })
        .toFile(path.join(imageDirs.large, filename));
      
      // Medium version (600px wide, JPEG quality 75)
      await image
        .clone()
        .resize(600, null, { withoutEnlargement: true })
        .jpeg({ quality: 75 })
        .toFile(path.join(imageDirs.medium, filename));
      
      // Thumbnail (200px wide, JPEG quality 70)
      await image
        .resize(200, null, { withoutEnlargement: true })
        .jpeg({ quality: 70 })
        .toFile(path.join(imageDirs.thumb, filename));
      
      saved.push(filename);
    } catch (err) {
      console.error(`Failed to process image ${filename}:`, err);
    }
  }
  return saved;
}

// Configure Cloudinary if env vars present
if (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
}

const router = express.Router();

// All admin routes require authentication and admin role
router.use(authenticate, isAdmin);

// Dashboard overview statistics
router.get("/dashboard", async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    // Date filter for analytics
    const dateFilter = {};
    if (startDate || endDate) {
      dateFilter.createdAt = {
        ...(startDate ? { $gte: new Date(startDate) } : {}),
        ...(endDate ? { $lte: new Date(endDate) } : {}),
      };
    }

    // Get order statistics
    const orderStats = await Order.getStatistics(startDate, endDate);

    // Get product statistics
    const productStats = await Product.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: null,
          totalProducts: { $sum: 1 },
          activeProducts: {
            $sum: { $cond: [{ $eq: ["$status", "active"] }, 1, 0] },
          },
          featuredProducts: {
            $sum: { $cond: [{ $eq: ["$isFeatured", true] }, 1, 0] },
          },
          lowStockProducts: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $eq: ["$stock.trackInventory", true] },
                    { $lte: ["$stock.quantity", "$stock.lowStockThreshold"] },
                  ],
                },
                1,
                0,
              ],
            },
          },
          outOfStockProducts: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $eq: ["$stock.trackInventory", true] },
                    { $eq: ["$stock.quantity", 0] },
                  ],
                },
                1,
                0,
              ],
            },
          },
        },
      },
    ]);

    // Get user statistics
    const userStats = await User.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: null,
          totalUsers: { $sum: 1 },
          activeUsers: {
            $sum: { $cond: [{ $eq: ["$isActive", true] }, 1, 0] },
          },
          adminUsers: {
            $sum: { $cond: [{ $eq: ["$role", "admin"] }, 1, 0] },
          },
        },
      },
    ]);

    // Get category count
    const categoryCount = await Category.countDocuments({ isActive: true });

    // Recent orders
    const recentOrders = await Order.find()
      .populate("user", "firstName lastName email")
      .populate("items.product", "name")
      .sort({ createdAt: -1 })
      .limit(5)
      .select("orderNumber status total createdAt user items")
      .lean();

    // Top selling products
    const topSellingProducts = await Product.find({ status: "active" })
      .sort({ salesCount: -1 })
      .limit(5)
      .select("name salesCount price images")
      .lean();

    // Low stock products
    const lowStockProducts = await Product.find({
      status: "active",
      "stock.trackInventory": true,
      $expr: {
        $lte: ["$stock.quantity", "$stock.lowStockThreshold"],
      },
    })
      .select("name stock images")
      .limit(10)
      .lean();

    // Sales chart data (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const salesChartData = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: thirtyDaysAgo },
          status: { $in: ["confirmed", "processing", "shipped", "delivered"] },
        },
      },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$createdAt" },
          },
          dailyRevenue: { $sum: "$total" },
          dailyOrders: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    res.json({
      overview: {
        orders: orderStats,
        products: productStats[0] || {
          totalProducts: 0,
          activeProducts: 0,
          featuredProducts: 0,
          lowStockProducts: 0,
          outOfStockProducts: 0,
        },
        users: userStats[0] || {
          totalUsers: 0,
          activeUsers: 0,
          adminUsers: 0,
        },
        categories: categoryCount,
      },
      recentOrders,
      topSellingProducts,
      lowStockProducts,
      salesChartData,
    });
  } catch (error) {
    console.error("Dashboard error:", error);
    res
      .status(500)
      .json({ message: "Server error while fetching dashboard data" });
  }
});

// Product analytics
router.get("/analytics/products", async (req, res) => {
  try {
    const { startDate, endDate, limit = 10 } = req.query;

    const dateFilter = {};
    if (startDate || endDate) {
      dateFilter.createdAt = {
        ...(startDate ? { $gte: new Date(startDate) } : {}),
        ...(endDate ? { $lte: new Date(endDate) } : {}),
      };
    }

    // Top selling products
    const topSelling = await Product.find({
      status: "active",
      ...dateFilter,
    })
      .sort({ salesCount: -1 })
      .limit(parseInt(limit))
      .select("name salesCount price images category")
      .populate("category", "name")
      .lean();

    // Most viewed products
    const mostViewed = await Product.find({
      status: "active",
      ...dateFilter,
    })
      .sort({ viewCount: -1 })
      .limit(parseInt(limit))
      .select("name viewCount price images category")
      .populate("category", "name")
      .lean();

    // Category-wise sales
    const categorySales = await Product.aggregate([
      { $match: { status: "active", ...dateFilter } },
      {
        $group: {
          _id: "$category",
          totalSales: { $sum: "$salesCount" },
          productCount: { $sum: 1 },
        },
      },
      {
        $lookup: {
          from: "categories",
          localField: "_id",
          foreignField: "_id",
          as: "categoryInfo",
        },
      },
      { $unwind: "$categoryInfo" },
      {
        $project: {
          categoryName: "$categoryInfo.name",
          totalSales: 1,
          productCount: 1,
        },
      },
      { $sort: { totalSales: -1 } },
    ]);

    res.json({
      topSelling,
      mostViewed,
      categorySales,
    });
  } catch (error) {
    console.error("Product analytics error:", error);
    res.status(500).json({
      message: "Server error while fetching product analytics",
    });
  }
});

// Order analytics
router.get("/analytics/orders", async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    const dateFilter = {};
    if (startDate || endDate) {
      dateFilter.createdAt = {
        ...(startDate ? { $gte: new Date(startDate) } : {}),
        ...(endDate ? { $lte: new Date(endDate) } : {}),
      };
    }

    // Order status breakdown
    const statusBreakdown = await Order.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
        },
      },
    ]);

    // Payment method breakdown
    const paymentBreakdown = await Order.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: "$paymentMethod",
          count: { $sum: 1 },
          totalAmount: { $sum: "$total" },
        },
      },
    ]);

    // Monthly revenue trend (last 12 months)
    const twelveMonthsAgo = new Date();
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);

    const monthlyRevenue = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: twelveMonthsAgo },
          status: { $in: ["confirmed", "processing", "shipped", "delivered"] },
        },
      },
      {
        $group: {
          _id: {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" },
          },
          revenue: { $sum: "$total" },
          orders: { $sum: 1 },
        },
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } },
    ]);

    res.json({
      statusBreakdown,
      paymentBreakdown,
      monthlyRevenue,
    });
  } catch (error) {
    console.error("Order analytics error:", error);
    res.status(500).json({
      message: "Server error while fetching order analytics",
    });
  }
});

// User analytics
router.get("/analytics/users", async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    const dateFilter = {};
    if (startDate || endDate) {
      dateFilter.createdAt = {
        ...(startDate ? { $gte: new Date(startDate) } : {}),
        ...(endDate ? { $lte: new Date(endDate) } : {}),
      };
    }

    // User registration trend
    const registrationTrend = await User.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" },
            day: { $dayOfMonth: "$createdAt" },
          },
          registrations: { $sum: 1 },
        },
      },
      { $sort: { "_id.year": 1, "_id.month": 1, "_id.day": 1 } },
    ]);

    // User role breakdown
    const roleBreakdown = await User.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: "$role",
          count: { $sum: 1 },
        },
      },
    ]);

    // User activity status
    const activityStatus = await User.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: "$isActive",
          count: { $sum: 1 },
        },
      },
    ]);

    res.json({
      registrationTrend,
      roleBreakdown,
      activityStatus,
    });
  } catch (error) {
    console.error("User analytics error:", error);
    res.status(500).json({
      message: "Server error while fetching user analytics",
    });
  }
});

// Category CRUD routes with enhanced features
router.post("/categories", upload.single("image"), async (req, res) => {
  try {
    const { 
      name, 
      nepaliName, 
      description, 
      sortOrder, 
      metaTitle, 
      metaDescription 
    } = req.body;
    
    let imageUrl = null;
    if (req.file && cloudinary.config().cloud_name) {
      const result = await new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          { folder: "koseli_categories" },
          (error, result) => {
            if (result) resolve(result);
            else reject(error);
          }
        );
        streamifier.createReadStream(req.file.buffer).pipe(stream);
      });
      imageUrl = result.secure_url;
    }
    
    const category = new Category({
      name,
      nepaliName,
      description,
      sortOrder: sortOrder || 0,
      isActive: true,
      image: imageUrl,
      metaTitle,
      metaDescription
    });
    
    await category.save();
    res.status(201).json({ message: "Category created", category });
  } catch (error) {
    console.error("Create category error:", error);
    res.status(500).json({ message: "Server error creating category" });
  }
});

router.get("/categories", async (req, res) => {
  try {
    const { 
      search, 
      isActive, 
      sortBy = "sortOrder", 
      sortOrder = "asc",
      page = 1,
      limit = 10
    } = req.query;

    const query = {};
    
    // Search by name or nepali name
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { nepaliName: { $regex: search, $options: 'i' } }
      ];
    }

    // Filter by active status
    if (isActive !== undefined) {
      query.isActive = isActive === 'true';
    }

    const totalCategories = await Category.countDocuments(query);
    
    const categories = await Category.find(query)
      .sort({ [sortBy]: sortOrder === 'asc' ? 1 : -1 })
      .populate("productCount")
      .skip((page - 1) * limit)
      .limit(Number(limit));

    res.json({
      categories,
      pagination: {
        total: totalCategories,
        page: Number(page),
        pages: Math.ceil(totalCategories / limit)
      }
    });
  } catch (error) {
    console.error("Get categories error:", error);
    res.status(500).json({ message: "Server error fetching categories" });
  }
});

router.put("/categories/:id", upload.single("image"), async (req, res) => {
  try {
    const { 
      name, 
      nepaliName, 
      description, 
      sortOrder, 
      isActive,
      metaTitle,
      metaDescription,
      removeImage
    } = req.body;
    
    const updateData = {
      name,
      nepaliName,
      description,
      sortOrder,
      isActive,
      metaTitle,
      metaDescription,
      updatedAt: new Date()
    };

    // Handle image update
    if (req.file && cloudinary.config().cloud_name) {
      const result = await new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          { folder: "koseli_categories" },
          (error, result) => {
            if (result) resolve(result);
            else reject(error);
          }
        );
        streamifier.createReadStream(req.file.buffer).pipe(stream);
      });
      updateData.image = result.secure_url;
    } else if (removeImage) {
      updateData.image = null;
    }
    
    const category = await Category.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    ).populate("productCount");
    
    if (!category) {
      return res.status(404).json({ message: "Category not found" });
    }
    
    res.json({ message: "Category updated", category });
  } catch (error) {
    console.error("Update category error:", error);
    res.status(500).json({ message: "Server error updating category" });
  }
});

// Bulk actions for categories
router.post("/categories/bulk", async (req, res) => {
  try {
    const { action, categoryIds } = req.body;

    if (!Array.isArray(categoryIds) || categoryIds.length === 0) {
      return res.status(400).json({ message: "Please select at least one category" });
    }

    switch (action) {
      case "activate":
      case "deactivate":
        await Category.updateMany(
          { _id: { $in: categoryIds } },
          { isActive: action === "activate" }
        );
        break;

      case "delete":
        // Check if any selected categories have products
        const productsCount = await Product.countDocuments({
          category: { $in: categoryIds }
        });

        if (productsCount > 0) {
          return res.status(400).json({
            message: "Cannot delete categories that have products. Please reassign or delete the products first."
          });
        }

        await Category.deleteMany({ _id: { $in: categoryIds } });
        break;

      default:
        return res.status(400).json({ message: "Invalid action" });
    }

    res.json({ 
      message: `Successfully ${action}d ${categoryIds.length} categories`
    });
  } catch (error) {
    console.error("Bulk category action error:", error);
    res.status(500).json({ message: "Server error performing bulk action" });
  }
});

router.delete("/categories/:id", async (req, res) => {
  try {
    // Check if category has products
    const productCount = await Product.countDocuments({ category: req.params.id });
    if (productCount > 0) {
      return res.status(400).json({ 
        message: "Cannot delete category with existing products. Please reassign or delete the products first." 
      });
    }
    
    const category = await Category.findByIdAndDelete(req.params.id);
    if (!category) {
      return res.status(404).json({ message: "Category not found" });
    }
    
    res.json({ message: "Category deleted successfully" });
  } catch (error) {
    console.error("Delete category error:", error);
    res.status(500).json({ message: "Server error deleting category" });
  }
});

// Products CRUD routes with enhanced features
router.get("/products", async (req, res) => {
  try {
    const {
      search,
      category,
      status,
      inStock,
      minPrice,
      maxPrice,
      sortBy = "createdAt",
      sortOrder = "desc",
      page = 1,
      limit = 10
    } = req.query;

    const query = {};

    // Search by name or description
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { shortDescription: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } }
      ];
    }

    // Filter by category
    if (category) {
      query.category = category;
    }

    // Filter by status
    if (status) {
      query.status = status;
    }

    // Filter by stock status
    if (inStock !== undefined) {
      if (inStock === 'true') {
        query['stock.quantity'] = { $gt: 0 };
      } else {
        query['stock.quantity'] = 0;
      }
    }

    // Filter by price range
    if (minPrice !== undefined || maxPrice !== undefined) {
      query.price = {};
      if (minPrice !== undefined) query.price.$gte = Number(minPrice);
      if (maxPrice !== undefined) query.price.$lte = Number(maxPrice);
    }

    const totalProducts = await Product.countDocuments(query);

    const products = await Product.find(query)
      .populate("category", "name nepaliName")
      .sort({ [sortBy]: sortOrder === 'asc' ? 1 : -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    res.json({
      products,
      pagination: {
        total: totalProducts,
        page: Number(page),
        pages: Math.ceil(totalProducts / limit)
      }
    });
  } catch (error) {
    console.error("Get products error:", error);
    res.status(500).json({ message: "Server error fetching products" });
  }
});

router.put("/products/:id", upload.single("image"), async (req, res) => {
  try {
    const { name, shortDescription, price, categoryId, status } = req.body;
    
    let updateData = {
      name,
      shortDescription,
      price: parseFloat(price),
      category: categoryId,
      status,
      updatedAt: new Date()
    };

    // Handle image upload: save locally into public/assets/products and set local URL
    if (req.file) {
      // determine slug - prefer provided name, fall back to existing product name
      const product = await Product.findById(req.params.id).select("name slug");
      const targetSlug = slugify(name || (product && product.name) || "product");
      const saved = await saveUploadedFiles([req.file], targetSlug);
      if (saved.length > 0) {
        updateData.images = [{
          url: `/assets/products/${saved[0]}`,
          urlLarge: `/assets/products/large/${saved[0]}`,
          urlMedium: `/assets/products/medium/${saved[0]}`,
          urlThumb: `/assets/products/thumb/${saved[0]}`,
          alt: name || product.name,
          isPrimary: true
        }];
      }
      // Optionally upload to cloudinary as well if configured
      else if (req.file && cloudinary.config().cloud_name) {
        const streamUpload = (buffer) => {
          return new Promise((resolve, reject) => {
            const stream = cloudinary.uploader.upload_stream((error, result) => {
              if (result) resolve(result);
              else reject(error);
            });
            streamifier.createReadStream(buffer).pipe(stream);
          });
        };
        const result = await streamUpload(req.file.buffer);
        updateData.images = [{ url: result.secure_url, alt: name, isPrimary: true }];
      }
    }

    const product = await Product.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    ).populate("category", "name nepaliName");

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    res.json({ message: "Product updated", product });
  } catch (error) {
    console.error("Update product error:", error);
    res.status(500).json({ message: "Server error updating product" });
  }
});

router.delete("/products/:id", async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }
    res.json({ message: "Product deleted successfully" });
  } catch (error) {
    console.error("Delete product error:", error);
    res.status(500).json({ message: "Server error deleting product" });
  }
});

module.exports = router;

router.post("/products", upload.any(), async (req, res) => {
  try {
    const { 
      name, 
      shortDescription, 
      price, 
      categoryId,
      tags,
      status,
      stock
    } = req.body;

    if (!name || !price || !categoryId) {
      return res.status(400).json({ message: "name, price and categoryId are required" });
    }

    // Handle multiple image uploads: save locally into public/assets/products
    const images = [];
    if (req.files && req.files.length > 0) {
      const slug = slugify(name);
      const saved = await saveUploadedFiles(req.files, slug);
      for (let i = 0; i < saved.length; i++) {
        // Add URLs for all image sizes
        images.push({ 
          url: `/assets/products/${saved[i]}`,
          urlLarge: `/assets/products/large/${saved[i]}`,
          urlMedium: `/assets/products/medium/${saved[i]}`,
          urlThumb: `/assets/products/thumb/${saved[i]}`,
          alt: name, 
          isPrimary: i === 0 
        });
      }

      // If local save failed and Cloudinary is configured, upload as fallback
      if (saved.length === 0 && cloudinary.config().cloud_name) {
        const streamUpload = (buffer) => {
          return new Promise((resolve, reject) => {
            const stream = cloudinary.uploader.upload_stream(
              { folder: "koseli_products" },
              (error, result) => {
                if (result) resolve(result);
                else reject(error);
              }
            );
            streamifier.createReadStream(buffer).pipe(stream);
          });
        };

        for (const file of req.files) {
          const result = await streamUpload(file.buffer);
          images.push({ url: result.secure_url, alt: name, isPrimary: images.length === 0 });
        }
      }
    }

    const parsedStock = stock ? JSON.parse(stock) : {
      quantity: 0,
      lowStockThreshold: 5,
      trackInventory: true
    };

    const parsedTags = tags ? JSON.parse(tags) : [];

    const product = new Product({
      name,
      shortDescription,
      price: parseFloat(price),
      category: categoryId,
      images,
      status: status || "active",
      tags: parsedTags,
      stock: parsedStock
    });

    await product.save();
    await product.populate("category", "name nepaliName");

    res.status(201).json({ message: "Product created", product });
  } catch (error) {
    console.error("Admin create product error:", error);
    res.status(500).json({ message: "Server error creating product" });
  }
});

// Bulk actions for products
router.post("/products/bulk", async (req, res) => {
  try {
    const { action, productIds } = req.body;

    if (!Array.isArray(productIds) || productIds.length === 0) {
      return res.status(400).json({ message: "Please select at least one product" });
    }

    switch (action) {
      case "activate":
      case "deactivate":
        await Product.updateMany(
          { _id: { $in: productIds } },
          { status: action === "activate" ? "active" : "inactive" }
        );
        break;

      case "delete":
        // Check if any selected products are in active orders
        const ordersWithProducts = await Order.countDocuments({
          "items.product": { $in: productIds },
          status: { $in: ["pending", "processing", "shipped"] }
        });

        if (ordersWithProducts > 0) {
          return res.status(400).json({
            message: "Cannot delete products that are in active orders."
          });
        }

        await Product.deleteMany({ _id: { $in: productIds } });
        break;

      case "updateStock":
        const { quantity } = req.body;
        if (typeof quantity !== "number") {
          return res.status(400).json({ message: "Invalid quantity value" });
        }

        await Product.updateMany(
          { _id: { $in: productIds } },
          { "stock.quantity": quantity }
        );
        break;

      default:
        return res.status(400).json({ message: "Invalid action" });
    }

    res.json({ 
      message: `Successfully ${action}d ${productIds.length} products`
    });
  } catch (error) {
    console.error("Bulk product action error:", error);
    res.status(500).json({ message: "Server error performing bulk action" });
  }
});


