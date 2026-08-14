// Product data retrieval handlers.

const fs = require('fs');
const path = require('path');
const Product = require('../models/Product');
const { isDbConnected, ensureDb } = require('../db');

const dataFilePath = path.join(__dirname, '../data/products.json');
// On Vercel (or any read-only FS), fall back to /tmp for JSON writes
const writableDataFilePath = process.env.VERCEL
  ? '/tmp/products.json'
  : dataFilePath;

function stripMongo(doc) {
  const { _id, __v, createdAt, updatedAt, ...rest } = doc;
  return rest;
}

async function readProducts() {
  await ensureDb();
  if (isDbConnected()) {
    try {
      const docs = await Product.find({}).sort({ id: 1 }).lean();
      return docs.map(stripMongo);
    } catch (err) {
      console.error('Error reading products from MongoDB:', err);
    }
  }

  try {
    const raw = fs.existsSync(writableDataFilePath)
      ? fs.readFileSync(writableDataFilePath, 'utf8')
      : fs.readFileSync(dataFilePath, 'utf8');
    return JSON.parse(raw);
  } catch (err) {
    console.error('Error reading products data file:', err);
    return [];
  }
}

async function saveProducts(products) {
  await ensureDb();
  if (isDbConnected()) {
    // MongoDB is primary — do NOT fall through to JSON on failure
    const ops = products.map(p => ({
      updateOne: {
        filter: { id: p.id },
        update: { $set: p },
        upsert: true
      }
    }));
    await Product.bulkWrite(ops); // throws on error — caught by caller
    return true;
  }

  // JSON fallback (local dev only — on Vercel use /tmp to avoid EROFS)
  try {
    fs.writeFileSync(writableDataFilePath, JSON.stringify(products, null, 2), 'utf8');
    return true;
  } catch (err) {
    console.error('Error saving products data file:', err);
    return false;
  }
}

async function deleteProductById(id) {
  await ensureDb();
  if (isDbConnected()) {
    const result = await Product.deleteOne({ id }); // throws on error
    return result.deletedCount > 0;
  }

  try {
    const raw = fs.existsSync(writableDataFilePath)
      ? fs.readFileSync(writableDataFilePath, 'utf8')
      : fs.readFileSync(dataFilePath, 'utf8');
    const products = JSON.parse(raw);
    const index = products.findIndex(p => p.id === id);
    if (index === -1) return false;
    products.splice(index, 1);
    fs.writeFileSync(writableDataFilePath, JSON.stringify(products, null, 2), 'utf8');
    return true;
  } catch (err) {
    console.error('Error deleting product from data file:', err);
    return false;
  }
}

// GET /api/v1/products
exports.getAllProducts = async (req, res) => {
  try {
    let products = await readProducts();
    const { category, q, sort } = req.query;

    if (category && category !== 'All Collections') {
      products = products.filter(p => p.category === category);
    }

    if (q) {
      const term = q.toLowerCase().trim();
      products = products.filter(p =>
        (p.name && p.name.toLowerCase().includes(term)) ||
        (p.shortDescription && p.shortDescription.toLowerCase().includes(term)) ||
        (p.category && p.category.toLowerCase().includes(term))
      );
    }

    if (sort === 'low-high') {
      products.sort((a, b) => a.price - b.price);
    } else if (sort === 'high-low') {
      products.sort((a, b) => b.price - a.price);
    } else if (sort === 'rating') {
      products.sort((a, b) => b.rating - a.rating);
    }

    res.json({
      success: true,
      count: products.length,
      data: products
    });
  } catch (err) {
    console.error('getAllProducts error:', err);
    res.status(500).json({ success: false, error: err.message || 'Server error' });
  }
};

// GET /api/v1/products/:id
exports.getProductById = async (req, res) => {
  try {
    const products = await readProducts();
    const id = parseInt(req.params.id, 10);
    const product = products.find(p => p.id === id);

    if (!product) {
      return res.status(404).json({
        success: false,
        error: 'Product not found'
      });
    }

    res.json({
      success: true,
      data: product
    });
  } catch (err) {
    console.error('getProductById error:', err);
    res.status(500).json({ success: false, error: err.message || 'Server error' });
  }
};

// POST /api/v1/products
exports.createProduct = async (req, res) => {
  try {
    const products = await readProducts();
    const {
      name,
      price,
      originalPrice,
      discount,
      category,
      images,
      shortDescription,
      fullDescription,
      features,
      specs,
      variants,
      availability,
      rating,
      reviewsCount
    } = req.body;

    if (!name || !price || !category) {
      return res.status(400).json({
        success: false,
        error: 'Product Name, Price, and Category are required.'
      });
    }

    const numPrice = parseFloat(price) || 0;
    const numOrigPrice = parseFloat(originalPrice) || numPrice;

    let calculatedDiscount = discount ? discount.trim() : '';
    if ((!calculatedDiscount || calculatedDiscount.endsWith('% OFF') || calculatedDiscount.endsWith('% off')) && numOrigPrice > numPrice && numOrigPrice > 0) {
      const pct = Math.round(((numOrigPrice - numPrice) / numOrigPrice) * 100);
      calculatedDiscount = `${pct}% OFF`;
    } else if (!calculatedDiscount && numOrigPrice > numPrice) {
      const pct = Math.round(((numOrigPrice - numPrice) / numOrigPrice) * 100);
      calculatedDiscount = `${pct}% OFF`;
    } else if (!calculatedDiscount) {
      calculatedDiscount = 'Special Price';
    }

    // Parse images array
    let imgList = [];
    if (Array.isArray(images)) {
      imgList = images.filter(i => typeof i === 'string' && i.trim().length > 0);
    } else if (typeof images === 'string') {
      imgList = images.split(',').map(s => s.trim()).filter(Boolean);
    }
    if (imgList.length === 0) {
      imgList = ['https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=800&q=80'];
    }

    // Parse features
    let featureList = [];
    if (Array.isArray(features)) {
      featureList = features;
    } else if (typeof features === 'string') {
      featureList = features.split('\n').map(f => f.trim()).filter(Boolean);
    }

    const maxId = products.reduce((max, p) => (p.id > max ? p.id : max), 0);
    const newProduct = {
      id: maxId + 1,
      name: name.trim(),
      price: numPrice,
      originalPrice: numOrigPrice,
      discount: calculatedDiscount,
      category: category.trim(),
      images: imgList,
      shortDescription: (shortDescription || name).trim(),
      fullDescription: (fullDescription || shortDescription || name).trim(),
      features: featureList.length > 0 ? featureList : [
        'Premium Fabric & Superior Stitching',
        'Comfortable Regular Fit',
        'Designed for Formal and Festive Occasions'
      ],
      specs: specs && typeof specs === 'object' ? specs : {
        "Brand": "SG Garments",
        "Fabric": "Premium Cotton & Silk Blend",
        "Fit": "Regular Fit",
        "Wash Care": "Dry Clean / Soft Hand Wash"
      },
      variants: variants && typeof variants === 'object' ? variants : {
        "colors": ["Standard Color"],
        "sizes": ["S", "M", "L", "XL", "XXL"]
      },
      availability: availability || 'In Stock (Fast Shipping)',
      rating: parseFloat(rating) || 4.8,
      reviewsCount: parseInt(reviewsCount, 10) || 12
    };

    products.unshift(newProduct);
    const saved = await saveProducts(products);

    if (!saved) {
      return res.status(500).json({
        success: false,
        error: 'Failed to save product.'
      });
    }

    res.status(201).json({
      success: true,
      message: 'Product created successfully',
      data: newProduct
    });
  } catch (err) {
    console.error('createProduct error:', err);
    res.status(500).json({ success: false, error: err.message || 'Internal server error' });
  }
};

// PUT /api/v1/products/:id
exports.updateProduct = async (req, res) => {
  try {
    const products = await readProducts();
    const id = parseInt(req.params.id, 10);
    const index = products.findIndex(p => p.id === id);

    if (index === -1) {
      return res.status(404).json({
        success: false,
        error: 'Product not found'
      });
    }

    const existing = products[index];
    const {
      name, price, originalPrice, discount, category,
      images, shortDescription, fullDescription, features,
      specs, variants, availability, rating, reviewsCount
    } = req.body;

    const newPrice = price !== undefined ? parseFloat(price) : existing.price;
    const newOrigPrice = originalPrice !== undefined ? parseFloat(originalPrice) : existing.originalPrice;
    let finalDiscount = discount !== undefined ? discount.trim() : existing.discount;

    if (newOrigPrice > newPrice && newOrigPrice > 0) {
      if (!finalDiscount || finalDiscount.endsWith('% OFF') || finalDiscount.endsWith('% off') || finalDiscount === 'SPECIAL' || discount !== undefined) {
        const pct = Math.round(((newOrigPrice - newPrice) / newOrigPrice) * 100);
        finalDiscount = `${pct}% OFF`;
      }
    }

    const updatedProduct = {
      ...existing,
      ...(name && { name: name.trim() }),
      price: newPrice,
      originalPrice: newOrigPrice,
      discount: finalDiscount,
      ...(category && { category: category.trim() }),
      ...(images && { images: Array.isArray(images) ? images : images.split(',').map(i => i.trim()).filter(Boolean) }),
      ...(shortDescription && { shortDescription }),
      ...(fullDescription && { fullDescription }),
      ...(features && { features: Array.isArray(features) ? features : features.split('\n').map(f => f.trim()).filter(Boolean) }),
      ...(specs && { specs }),
      ...(variants && { variants }),
      ...(availability && { availability }),
      ...(rating !== undefined && { rating: parseFloat(rating) }),
      ...(reviewsCount !== undefined && { reviewsCount: parseInt(reviewsCount, 10) })
    };

    products[index] = updatedProduct;
    const saved = await saveProducts(products);

    if (!saved) {
      return res.status(500).json({ success: false, error: 'Failed to save product.' });
    }

    res.json({ success: true, message: 'Product updated successfully', data: updatedProduct });
  } catch (err) {
    console.error('updateProduct error:', err);
    res.status(500).json({ success: false, error: err.message || 'Internal server error' });
  }
};

// DELETE /api/v1/products/:id
exports.deleteProduct = async (req, res) => {
  try {
    const products = await readProducts();
    const id = parseInt(req.params.id, 10);
    const index = products.findIndex(p => p.id === id);

    if (index === -1) {
      return res.status(404).json({
        success: false,
        error: 'Product not found'
      });
    }

    const deleted = products[index];
    const removed = await deleteProductById(id);

    if (!removed) {
      return res.status(500).json({
        success: false,
        error: 'Failed to delete product.'
      });
    }

    res.json({
      success: true,
      message: 'Product deleted successfully',
      data: deleted
    });
  } catch (err) {
    console.error('deleteProduct error:', err);
    res.status(500).json({ success: false, error: err.message || 'Internal server error' });
  }
};
