import express from 'express';
import Database from 'better-sqlite3';
import dotenv from 'dotenv';

dotenv.config();

const router = express.Router();
const dbPath = process.env.DATABASE_PATH || './server/database/pos.db';
const db = new Database(dbPath);

// GET /api/menu - Get full menu
router.get('/', (req, res) => {
  try {
    const stmt = db.prepare('SELECT * FROM menu_items WHERE is_available = 1 ORDER BY category, name');
    const items = stmt.all();

    // Parse modifiers JSON
    const parsedItems = items.map(item => ({
      ...item,
      modifiers: item.modifiers ? JSON.parse(item.modifiers) : [],
      is_available: Boolean(item.is_available)
    }));

    // Group by category
    const categories = {};
    parsedItems.forEach(item => {
      if (!categories[item.category]) {
        categories[item.category] = [];
      }
      categories[item.category].push(item);
    });

    res.json({
      success: true,
      total_items: parsedItems.length,
      categories
    });
  } catch (error) {
    console.error('Error fetching menu:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch menu',
      message: error.message
    });
  }
});

// GET /api/menu/:category - Get menu by category
router.get('/:category', (req, res) => {
  try {
    const stmt = db.prepare('SELECT * FROM menu_items WHERE category = ? AND is_available = 1 ORDER BY name');
    const items = stmt.all(req.params.category);

    if (items.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Category not found or no items available'
      });
    }

    // Parse modifiers JSON
    const parsedItems = items.map(item => ({
      ...item,
      modifiers: item.modifiers ? JSON.parse(item.modifiers) : [],
      is_available: Boolean(item.is_available)
    }));

    res.json({
      success: true,
      category: req.params.category,
      count: parsedItems.length,
      items: parsedItems
    });
  } catch (error) {
    console.error('Error fetching category:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch category',
      message: error.message
    });
  }
});

// GET /api/menu/item/:id - Get single item
router.get('/item/:id', (req, res) => {
  try {
    const stmt = db.prepare('SELECT * FROM menu_items WHERE id = ?');
    const item = stmt.get(req.params.id);

    if (!item) {
      return res.status(404).json({
        success: false,
        error: 'Menu item not found'
      });
    }

    // Parse modifiers JSON
    const parsedItem = {
      ...item,
      modifiers: item.modifiers ? JSON.parse(item.modifiers) : [],
      is_available: Boolean(item.is_available)
    };

    res.json({
      success: true,
      item: parsedItem
    });
  } catch (error) {
    console.error('Error fetching menu item:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch menu item',
      message: error.message
    });
  }
});

// GET /api/menu/search - Search menu items
router.get('/search/query', (req, res) => {
  try {
    const { q } = req.query;

    if (!q) {
      return res.status(400).json({
        success: false,
        error: 'Search query (q) is required'
      });
    }

    const stmt = db.prepare(`
      SELECT * FROM menu_items
      WHERE (name LIKE ? OR chinese_name LIKE ? OR description LIKE ?)
      AND is_available = 1
      ORDER BY name
      LIMIT 50
    `);

    const searchTerm = `%${q}%`;
    const items = stmt.all(searchTerm, searchTerm, searchTerm);

    // Parse modifiers JSON
    const parsedItems = items.map(item => ({
      ...item,
      modifiers: item.modifiers ? JSON.parse(item.modifiers) : [],
      is_available: Boolean(item.is_available)
    }));

    res.json({
      success: true,
      query: q,
      count: parsedItems.length,
      items: parsedItems
    });
  } catch (error) {
    console.error('Error searching menu:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to search menu',
      message: error.message
    });
  }
});

export default router;
