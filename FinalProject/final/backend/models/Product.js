const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    shortDescription: {
      type: String,
      maxlength: 200,
      trim: true,
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: true,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    comparePrice: {
      type: Number,
      min: 0,
    },
    costPrice: {
      type: Number,
      min: 0,
    },
    sku: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
    },
    barcode: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
    },
    stock: {
      quantity: {
        type: Number,
        required: true,
        min: 0,
        default: 0,
      },
      lowStockThreshold: {
        type: Number,
        default: 10,
      },
      trackInventory: {
        type: Boolean,
        default: true,
      },
    },
    weight: {
      value: Number,
      unit: {
        type: String,
        enum: ["g", "kg", "lb", "oz", "ml", "l"],
        default: "g",
      },
    },
    dimensions: {
      length: Number,
      width: Number,
      height: Number,
      unit: {
        type: String,
        enum: ["cm", "in", "m"],
        default: "cm",
      },
    },
    images: [
      {
        url: String, // Original image
        urlLarge: String, // 1200px wide version
        urlMedium: String, // 600px wide version
        urlThumb: String, // 200px wide version
        alt: String,
        isPrimary: {
          type: Boolean,
          default: false,
        },
      },
    ],
    // Nepali specific fields
    nepaliName: {
      type: String,
      trim: true,
    },
    origin: {
      type: String,
      enum: ["Nepal", "India", "USA", "Other"],
      default: "Other",
    },
    // Product attributes
    attributes: [
      {
        name: String,
        value: String,
      },
    ],
    // SEO fields
    metaTitle: String,
    metaDescription: String,
    tags: [String],
    // Status
    status: {
      type: String,
      enum: ["active", "inactive", "draft"],
      default: "active",
    },
    isFeatured: {
      type: Boolean,
      default: false,
    },
    isDigital: {
      type: Boolean,
      default: false,
    },
    // Sales data
    salesCount: {
      type: Number,
      default: 0,
    },
    viewCount: {
      type: Number,
      default: 0,
    },
    // Timestamps
    createdAt: {
      type: Date,
      default: Date.now,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for better query performance
// Note: These indexes are created automatically by Mongoose
// The unique constraints are handled by the schema definition

// Update timestamp on save
productSchema.pre("save", function (next) {
  this.updatedAt = new Date();
  next();
});

// Generate slug from name
productSchema.pre("save", function (next) {
  if (this.isModified("name") && !this.slug) {
    this.slug = this.name
      .toLowerCase()
      .replace(/[^a-z0-9 -]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .trim("-");
  }
  next();
});

// Virtual for discount percentage
productSchema.virtual("discountPercentage").get(function () {
  if (this.comparePrice && this.comparePrice > this.price) {
    return Math.round(
      ((this.comparePrice - this.price) / this.comparePrice) * 100
    );
  }
  return 0;
});

// Virtual for primary image
productSchema.virtual("primaryImage").get(function () {
  const primaryImg = this.images.find((img) => img.isPrimary) || this.images[0];
  if (!primaryImg) return null;

  // Prefer medium size for general display, fall back to original if no optimized versions
  return primaryImg.urlMedium || primaryImg.url;
});

// Virtual for stock status
productSchema.virtual("stockStatus").get(function () {
  if (!this.stock.trackInventory) return "unlimited";
  if (this.stock.quantity === 0) return "out_of_stock";
  if (this.stock.quantity <= this.stock.lowStockThreshold) return "low_stock";
  return "in_stock";
});

// Method to decrease stock
productSchema.methods.decreaseStock = function (quantity) {
  if (this.stock.trackInventory) {
    if (this.stock.quantity < quantity) {
      throw new Error("Insufficient stock");
    }
    this.stock.quantity -= quantity;
  }
  return this.save();
};

// Method to increase stock
productSchema.methods.increaseStock = function (quantity) {
  if (this.stock.trackInventory) {
    this.stock.quantity += quantity;
  }
  return this.save();
};

// Populate virtual fields when converting to JSON
productSchema.set("toJSON", { virtuals: true });

module.exports = mongoose.model("Product", productSchema);
