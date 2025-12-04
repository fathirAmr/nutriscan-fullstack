const express = require('express');
const cors = require('cors');
const db = require('./db');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Test route
app.get('/', (req, res) => {
  res.json({ message: 'NutriScan API Running!' });
});

// API: Get all products
app.get('/api/products', async (req, res) => {
  try {
    const [products] = await db.query('SELECT * FROM products ORDER BY name');
    res.json({ success: true, data: products });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// API: Get product by barcode
app.get('/api/products/barcode/:barcode', async (req, res) => {
  try {
    const { barcode } = req.params;
    
    // Get product
    const [products] = await db.query(
      'SELECT * FROM products WHERE barcode = ?',
      [barcode]
    );
    
    if (products.length === 0) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }
    
    const product = products[0];
    
    // Get nutrition
    const [nutrition] = await db.query(
      'SELECT * FROM nutrition WHERE product_id = ?',
      [product.id]
    );
    
    // Get ingredients
    const [ingredients] = await db.query(
      'SELECT ingredient FROM ingredients WHERE product_id = ?',
      [product.id]
    );
    
    // Get allergens
    const [allergens] = await db.query(
      'SELECT allergen FROM allergens WHERE product_id = ?',
      [product.id]
    );
    
    // Get additives
    const [additives] = await db.query(
      'SELECT additive FROM additives WHERE product_id = ?',
      [product.id]
    );
    
    // Combine data
    const result = {
      ...product,
      nutrition: nutrition[0] || null,
      ingredients: ingredients.map(i => i.ingredient),
      allergens: allergens.map(a => a.allergen),
      additives: additives.map(a => a.additive)
    };
    
    res.json({ success: true, data: result });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// API: Search products by name
app.get('/api/products/search/:query', async (req, res) => {
  try {
    const { query } = req.params;
    
    const [products] = await db.query(
      'SELECT * FROM products WHERE name LIKE ? OR brand LIKE ? ORDER BY name',
      [`%${query}%`, `%${query}%`]
    );
    
    res.json({ success: true, data: products });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// API: Get product detail by ID
app.get('/api/products/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Get product
    const [products] = await db.query(
      'SELECT * FROM products WHERE id = ?',
      [id]
    );
    
    if (products.length === 0) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }
    
    const product = products[0];
    
    // Get related data
    const [nutrition] = await db.query(
      'SELECT * FROM nutrition WHERE product_id = ?',
      [id]
    );
    
    const [ingredients] = await db.query(
      'SELECT ingredient FROM ingredients WHERE product_id = ?',
      [id]
    );
    
    const [allergens] = await db.query(
      'SELECT allergen FROM allergens WHERE product_id = ?',
      [id]
    );
    
    const [additives] = await db.query(
      'SELECT additive FROM additives WHERE product_id = ?',
      [id]
    );
    
    const result = {
      ...product,
      nutrition: nutrition[0] || null,
      ingredients: ingredients.map(i => i.ingredient),
      allergens: allergens.map(a => a.allergen),
      additives: additives.map(a => a.additive)
    };
    
    res.json({ success: true, data: result });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// API: Add to scan history
app.post('/api/history', async (req, res) => {
  try {
    const { product_id } = req.body;
    
    await db.query(
      'INSERT INTO scan_history (product_id) VALUES (?)',
      [product_id]
    );
    
    res.json({ success: true, message: 'Added to history' });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// API: Get scan history
app.get('/api/history', async (req, res) => {
  try {
    const [history] = await db.query(`
      SELECT 
        h.id, 
        h.scanned_at,
        p.* 
      FROM scan_history h
      JOIN products p ON h.product_id = p.id
      ORDER BY h.scanned_at DESC
      LIMIT 10
    `);
    
    res.json({ success: true, data: history });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
