import Database from 'better-sqlite3';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const dbPath = process.env.DATABASE_PATH || join(__dirname, 'pos.db');
const schemaPath = join(__dirname, 'schema.sql');
const menuDataPath = join(__dirname, '../data/menu.json');

console.log('🚀 Initializing database...');

// Create database connection
const db = new Database(dbPath);

// Enable foreign keys
db.pragma('foreign_keys = ON');

// Read and execute schema
console.log('📋 Creating tables...');
const schema = readFileSync(schemaPath, 'utf8');
db.exec(schema);

// Load and insert menu data
console.log('🍜 Loading menu data...');
try {
  const menuData = JSON.parse(readFileSync(menuDataPath, 'utf8'));

  const insertMenuItem = db.prepare(`
    INSERT OR REPLACE INTO menu_items (id, category, name, chinese_name, description, price, modifiers, is_available)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertMany = db.transaction((items) => {
    for (const item of items) {
      insertMenuItem.run(
        item.id,
        item.category,
        item.name,
        item.chinese_name || null,
        item.description || null,
        item.price,
        item.modifiers ? JSON.stringify(item.modifiers) : null,
        item.is_available !== undefined ? item.is_available : 1
      );
    }
  });

  // Process all categories and items
  let totalItems = 0;
  for (const category of menuData.categories) {
    const items = category.items.map(item => ({
      ...item,
      category: category.id
    }));
    insertMany(items);
    totalItems += items.length;
    console.log(`  ✓ Loaded ${items.length} items from ${category.name}`);
  }

  console.log(`✅ Database initialized successfully!`);
  console.log(`📊 Total menu items loaded: ${totalItems}`);

} catch (error) {
  console.error('❌ Error loading menu data:', error.message);
  console.error('Make sure server/data/menu.json exists and is valid JSON');
  process.exit(1);
}

db.close();
