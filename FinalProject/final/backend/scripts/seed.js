const mongoose = require("mongoose");
const dotenv = require("dotenv");
const fs = require("fs");
const path = require("path");

dotenv.config();

const User = require("../models/User");
const Category = require("../models/Category");
const Product = require("../models/Product");

const productImagesDir = path.join(__dirname, "..", "public", "assets", "products");

// Create product images directory if it doesn't exist
if (!fs.existsSync(productImagesDir)) {
  fs.mkdirSync(productImagesDir, { recursive: true });
}

// Create resized image directories
const imageDirs = {
  original: productImagesDir,
  large: path.join(productImagesDir, "large"),
  medium: path.join(productImagesDir, "medium"),
  thumb: path.join(productImagesDir, "thumb"),
};

for (const d of Object.values(imageDirs)) {
  if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true });
}

// Create a default product image if it doesn't exist
const defaultImagePath = path.join(productImagesDir, "default-product.jpg");
if (!fs.existsSync(defaultImagePath)) {
  // Create a simple 1x1 pixel JPEG
  const defaultImageData = Buffer.from([
    0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01,
    0x01, 0x01, 0x00, 0x48, 0x00, 0x48, 0x00, 0x00, 0xff, 0xdb, 0x00, 0x43,
    0x00, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff,
    0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff,
    0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff,
    0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff,
    0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff,
    0xff, 0xff, 0xff, 0xff, 0xff, 0xc0, 0x00, 0x0b, 0x08, 0x00, 0x01, 0x00,
    0x01, 0x01, 0x01, 0x11, 0x00, 0xff, 0xc4, 0x00, 0x14, 0x00, 0x01, 0x00,
    0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
    0x00, 0x00, 0x00, 0xff, 0xda, 0x00, 0x08, 0x01, 0x01, 0x00, 0x00, 0x3f,
    0x00, 0x37, 0xff, 0xd9
  ]);
  fs.writeFileSync(defaultImagePath, defaultImageData);
}

// Note: image downloading to remote URLs was attempted earlier but can be
// unreliable due to remote host restrictions. This script now uses a
// local default product image stored in public/assets/products.

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

async function ensureAdminUser() {
  const adminEmail = process.env.SEED_ADMIN_EMAIL || "admin@koseli.local";
  const adminPassword = process.env.SEED_ADMIN_PASSWORD || "Admin@12345";

  let admin = await User.findOne({ email: adminEmail });
  if (admin) {
    if (admin.role !== "admin") {
      admin.role = "admin";
      await admin.save();
    }
    return admin;
  }

  admin = new User({
    firstName: "Koseli",
    lastName: "Admin",
    email: adminEmail,
    password: adminPassword,
    role: "admin",
    provider: "local",
  });
  await admin.save();
  return admin;
}

async function ensureCategories() {
  const categories = [
    {
      name: "Nepali Products",
      nepaliName: "नेपाली सामग्री",
      description: "Authentic products from Nepal",
      sortOrder: 1
    },
    {
      name: "Spices & Seasonings",
      nepaliName: "मसला र मसिना",
      description: "Traditional spices and seasonings",
      sortOrder: 2
    },
    {
      name: "Tea & Beverages",
      nepaliName: "चिया र पेय पदार्थ",
      description: "Traditional teas and beverages",
      sortOrder: 3
    },
    {
      name: "Rice & Grains",
      nepaliName: "चामल र अनाज",
      description: "Traditional rice and grain products",
      sortOrder: 4
    },
    {
      name: "Snacks & Sweets",
      nepaliName: "खाजा र मिठाई",
      description: "Traditional snacks and sweets",
      sortOrder: 5
    },
    {
      name: "Health & Wellness",
      nepaliName: "स्वास्थ्य र कल्याण",
      description: "Natural health and wellness products",
      sortOrder: 6
    }
  ];

  const createdCategories = [];
  
  for (const catData of categories) {
    const slug = slugify(catData.name);
    let category = await Category.findOne({ slug });
    
    if (!category) {
      category = new Category({
        ...catData,
        slug,
        isActive: true,
      });
      await category.save();
    }
    
    createdCategories.push(category);
  }
  
  return createdCategories;
}

async function ensureSampleUsers() {
  const sampleUsers = [
    {
      firstName: "Ram",
      lastName: "Sharma",
      email: "ram.sharma@example.com",
      password: "User12345",
      phone: "+977-9841234567",
      address: {
        street: "Thamel Street 123",
        city: "Kathmandu",
        state: "Bagmati",
        zipCode: "44600",
        country: "Nepal"
      },
      role: "user",
      provider: "local"
    },
    {
      firstName: "Sita",
      lastName: "Gurung",
      email: "sita.gurung@example.com",
      password: "User12345",
      phone: "+977-9851234567",
      address: {
        street: "Pokhara Lakeside",
        city: "Pokhara",
        state: "Gandaki",
        zipCode: "33700",
        country: "Nepal"
      },
      role: "user",
      provider: "local"
    },
    {
      firstName: "Hari",
      lastName: "Thapa",
      email: "hari.thapa@example.com",
      password: "User12345",
      phone: "+977-9861234567",
      address: {
        street: "Chitwan Main Road",
        city: "Bharatpur",
        state: "Bagmati",
        zipCode: "44200",
        country: "Nepal"
      },
      role: "user",
      provider: "local"
    },
    {
      firstName: "Gita",
      lastName: "Maharjan",
      email: "gita.maharjan@example.com",
      password: "User12345",
      phone: "+977-9871234567",
      address: {
        street: "Lalitpur Durbar Square",
        city: "Lalitpur",
        state: "Bagmati",
        zipCode: "44700",
        country: "Nepal"
      },
      role: "user",
      provider: "local"
    },
    {
      firstName: "John",
      lastName: "Smith",
      email: "john.smith@example.com",
      password: "User12345",
      phone: "+1-555-123-4567",
      address: {
        street: "123 Main Street",
        city: "New York",
        state: "NY",
        zipCode: "10001",
        country: "USA"
      },
      role: "user",
      provider: "local"
    }
  ];

  for (const userData of sampleUsers) {
    const existing = await User.findOne({ email: userData.email });
    if (existing) continue;

    const user = new User(userData);
    await user.save();
  }
}

async function ensureSampleProducts(categories) {
  const products = [
    // Nepali Products
    {
      name: "Gundruk (Fermented Leafy Greens)",
      nepaliName: "गुन्द्रुक",
      description: "Traditional Nepali fermented leafy greens, rich in probiotics and flavor.",
      shortDescription: "Traditional fermented greens",
      price: 6.99,
      comparePrice: 7.99,
      stock: { quantity: 100, lowStockThreshold: 10, trackInventory: true },
      weight: { value: 200, unit: "g" },
      origin: "Nepal",
      tags: ["nepali", "traditional", "gundruk"],
      categoryName: "Nepali Products",
      images: [],
    },
    {
      name: "Sukuti (Dried Meat)",
      nepaliName: "सुकुटी",
      description: "Traditional Nepali dried meat, perfect for snacks and cooking.",
      shortDescription: "Traditional dried meat",
      price: 12.99,
      comparePrice: 14.99,
      stock: { quantity: 50, lowStockThreshold: 5, trackInventory: true },
      weight: { value: 150, unit: "g" },
      origin: "Nepal",
      tags: ["nepali", "meat", "sukuti"],
      categoryName: "Nepali Products",
      images: [],
    },
    
    // Spices & Seasonings
    {
      name: "Timur (Szechuan Pepper)",
      nepaliName: "तिमुर",
      description: "Aromatic Nepali timur pepper with unique citrusy flavor.",
      shortDescription: "Aromatic timur pepper",
      price: 8.99,
      comparePrice: 9.99,
      stock: { quantity: 80, lowStockThreshold: 10, trackInventory: true },
      weight: { value: 100, unit: "g" },
      origin: "Nepal",
      tags: ["spice", "timur", "pepper"],
      categoryName: "Spices & Seasonings",
      images: [],
    },
    {
      name: "Jimbu (Himalayan Herb)",
      nepaliName: "जिम्बु",
      description: "Traditional Himalayan herb used in Nepali cooking.",
      shortDescription: "Himalayan cooking herb",
      price: 5.99,
      comparePrice: 6.99,
      stock: { quantity: 60, lowStockThreshold: 8, trackInventory: true },
      weight: { value: 50, unit: "g" },
      origin: "Nepal",
      tags: ["herb", "jimbu", "himalayan"],
      categoryName: "Spices & Seasonings",
      images: [],
    },
    {
      name: "Masala Mix (Curry Powder)",
      nepaliName: "मसला मिक्स",
      description: "Traditional Nepali curry powder blend with authentic spices.",
      shortDescription: "Traditional curry powder",
      price: 4.99,
      comparePrice: 5.99,
      stock: { quantity: 120, lowStockThreshold: 15, trackInventory: true },
      weight: { value: 200, unit: "g" },
      origin: "Nepal",
      tags: ["spice", "curry", "masala"],
      categoryName: "Spices & Seasonings",
      images: [],
    },
    
    // Tea & Beverages
    {
      name: "Masala Tea Blend",
      nepaliName: "मसला चिया",
      description: "Aromatic Nepali masala tea blend with cardamom, ginger, and spices.",
      shortDescription: "Aromatic masala tea",
      price: 4.99,
      comparePrice: 5.99,
      stock: { quantity: 150, lowStockThreshold: 20, trackInventory: true },
      weight: { value: 250, unit: "g" },
      origin: "Nepal",
      tags: ["nepali", "tea", "masala"],
      categoryName: "Tea & Beverages",
      images: [],
    },
    {
      name: "Ilam Tea (Black Tea)",
      nepaliName: "इलाम चिया",
      description: "Premium black tea from Ilam, Nepal's famous tea region.",
      shortDescription: "Premium Ilam black tea",
      price: 7.99,
      comparePrice: 8.99,
      stock: { quantity: 100, lowStockThreshold: 12, trackInventory: true },
      weight: { value: 250, unit: "g" },
      origin: "Nepal",
      tags: ["tea", "ilam", "black"],
      categoryName: "Tea & Beverages",
      images: [],
    },
    {
      name: "Chiya (Nepali Tea)",
      nepaliName: "चिया",
      description: "Traditional Nepali tea blend, perfect for daily consumption.",
      shortDescription: "Traditional Nepali tea",
      price: 3.99,
      comparePrice: 4.99,
      stock: { quantity: 200, lowStockThreshold: 25, trackInventory: true },
      weight: { value: 500, unit: "g" },
      origin: "Nepal",
      tags: ["tea", "traditional", "chiya"],
      categoryName: "Tea & Beverages",
      images: [],
    },
    
    // Rice & Grains
    {
      name: "Chiura (Beaten Rice)",
      nepaliName: "चिउरा",
      description: "Crispy beaten rice, a staple snack in Nepali cuisine.",
      shortDescription: "Crispy beaten rice",
      price: 3.49,
      comparePrice: 3.99,
      stock: { quantity: 200, lowStockThreshold: 15, trackInventory: true },
      weight: { value: 500, unit: "g" },
      origin: "Nepal",
      tags: ["nepali", "snack", "chiura"],
      categoryName: "Rice & Grains",
      images: [],
    },
    {
      name: "Basmati Rice (Premium)",
      nepaliName: "बासमती चामल",
      description: "Premium basmati rice from Nepal, long grain and aromatic.",
      shortDescription: "Premium basmati rice",
      price: 8.99,
      comparePrice: 9.99,
      stock: { quantity: 80, lowStockThreshold: 10, trackInventory: true },
      weight: { value: 1000, unit: "g" },
      origin: "Nepal",
      tags: ["rice", "basmati", "premium"],
      categoryName: "Rice & Grains",
      images: [],
    },
    {
      name: "Red Rice (Traditional)",
      nepaliName: "रातो चामल",
      description: "Traditional red rice from Nepal, rich in nutrients.",
      shortDescription: "Traditional red rice",
      price: 6.99,
      comparePrice: 7.99,
      stock: { quantity: 90, lowStockThreshold: 12, trackInventory: true },
      weight: { value: 1000, unit: "g" },
      origin: "Nepal",
      tags: ["rice", "red", "traditional"],
      categoryName: "Rice & Grains",
      images: [],
    },
    
    // Snacks & Sweets
    {
      name: "Sel Roti (Rice Donut)",
      nepaliName: "सेल रोटी",
      description: "Traditional Nepali rice donut, crispy and sweet.",
      shortDescription: "Traditional rice donut",
      price: 2.99,
      comparePrice: 3.49,
      stock: { quantity: 150, lowStockThreshold: 20, trackInventory: true },
      weight: { value: 200, unit: "g" },
      origin: "Nepal",
      tags: ["snack", "sweet", "sel-roti"],
      categoryName: "Snacks & Sweets",
      images: [],
    },
    {
      name: "Laddu (Sweet Balls)",
      nepaliName: "लड्डू",
      description: "Traditional Nepali sweet balls made with gram flour.",
      shortDescription: "Traditional sweet balls",
      price: 4.99,
      comparePrice: 5.99,
      stock: { quantity: 100, lowStockThreshold: 15, trackInventory: true },
      weight: { value: 300, unit: "g" },
      origin: "Nepal",
      tags: ["sweet", "laddu", "traditional"],
      categoryName: "Snacks & Sweets",
      images: [],
    },
    {
      name: "Khir (Rice Pudding)",
      nepaliName: "खिर",
      description: "Traditional Nepali rice pudding, creamy and delicious.",
      shortDescription: "Traditional rice pudding",
      price: 3.99,
      comparePrice: 4.49,
      stock: { quantity: 120, lowStockThreshold: 18, trackInventory: true },
      weight: { value: 400, unit: "g" },
      origin: "Nepal",
      tags: ["sweet", "khir", "pudding"],
      categoryName: "Snacks & Sweets",
      images: [],
    },
    
    // Health & Wellness
    {
      name: "Chyawanprash (Herbal Jam)",
      nepaliName: "च्यवनप्राश",
      description: "Traditional Ayurvedic herbal jam for health and immunity.",
      shortDescription: "Ayurvedic herbal jam",
      price: 15.99,
      comparePrice: 17.99,
      stock: { quantity: 60, lowStockThreshold: 8, trackInventory: true },
      weight: { value: 500, unit: "g" },
      origin: "Nepal",
      tags: ["health", "ayurvedic", "immunity"],
      categoryName: "Health & Wellness",
      images: [],
    },
    {
      name: "Turmeric Powder (Organic)",
      nepaliName: "बेसार",
      description: "Organic turmeric powder with anti-inflammatory properties.",
      shortDescription: "Organic turmeric powder",
      price: 6.99,
      comparePrice: 7.99,
      stock: { quantity: 100, lowStockThreshold: 12, trackInventory: true },
      weight: { value: 200, unit: "g" },
      origin: "Nepal",
      tags: ["health", "turmeric", "organic"],
      categoryName: "Health & Wellness",
      images: [],
    },
    {
      name: "Ginger Powder (Dried)",
      nepaliName: "अदुवा पाउडर",
      description: "Dried ginger powder, great for digestion and health.",
      shortDescription: "Dried ginger powder",
      price: 5.99,
      comparePrice: 6.99,
      stock: { quantity: 80, lowStockThreshold: 10, trackInventory: true },
      weight: { value: 150, unit: "g" },
      origin: "Nepal",
      tags: ["health", "ginger", "digestion"],
      categoryName: "Health & Wellness",
      images: [],
    }
  ];

  for (const productData of products) {
    const slug = slugify(productData.name);
    const existing = await Product.findOne({ slug });
    if (existing) continue;

    // Find the category by name
    const category = categories.find(cat => cat.name === productData.categoryName);
    if (!category) continue;

    // Always use local image from assets/products if present
    const exts = [".jpg", ".jpeg", ".png", ".webp"];
    let localFile = null;
    for (const ext of exts) {
      const candidate = `${slug}${ext}`;
      if (fs.existsSync(path.join(productImagesDir, candidate))) {
        localFile = candidate;
        break;
      }
    }
    const images = [];
    if (localFile) {
      const localUrl = `/assets/products/${localFile}`;
      images.push({
        url: localUrl,
        urlLarge: `/assets/products/large/${localFile}`,
        urlMedium: `/assets/products/medium/${localFile}`,
        urlThumb: `/assets/products/thumb/${localFile}`,
        alt: productData.name,
        isPrimary: true,
      });
    } else {
      // Fallback to default image if no local file
      const defaultUrl = '/assets/products/default-product.jpg';
      images.push({
        url: defaultUrl,
        urlLarge: defaultUrl,
        urlMedium: defaultUrl,
        urlThumb: defaultUrl,
        alt: productData.name,
        isPrimary: true,
      });
    }

    console.log(`Processed images for ${productData.name}:`, images);

    const product = new Product({
      ...productData,
      slug,
      category: category._id,
      images,
      status: "active",
      isFeatured: Math.random() > 0.5, // Randomly feature some products
    });
    await product.save();
  }
}

async function main() {
  const mongoUri = process.env.MONGODB_URI || "mongodb://localhost:27017/koseli_mart";
  await mongoose.connect(mongoUri);
  try {
    const admin = await ensureAdminUser();
    console.log("Admin ready:", admin.email);

    const categories = await ensureCategories();
    console.log("Categories ready:", categories.length, "categories created");

    await ensureSampleUsers();
    console.log("Sample users ensured.");

    await ensureSampleProducts(categories);
    console.log("Sample products ensured.");
  } finally {
    await mongoose.disconnect();
  }
}

main()
  .then(() => {
    console.log("Seeding completed successfully.");
    process.exit(0);
  })
  .catch((err) => {
    console.error("Seeding failed:", err);
    process.exit(1);
  });


