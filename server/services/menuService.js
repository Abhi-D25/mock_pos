import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load menu data
const menuPath = path.join(__dirname, '../data/menu.json');
let menuData = null;
let priceMap = new Map();

// Common substitutions for fuzzy matching
const SUBSTITUTIONS = {
  'general tso': 'general tao',
  'general tso\'s': 'general tao\'s',
  'steamed rice': 'white rice',
};

// Load and parse menu
function loadMenu() {
  try {
    const rawData = fs.readFileSync(menuPath, 'utf8');
    menuData = JSON.parse(rawData);
    buildPriceMap();
    console.log('[Menu Service] Menu loaded successfully');
    console.log(`[Menu Service] Total menu items: ${priceMap.size}`);
  } catch (error) {
    console.error('[Menu Service] Error loading menu:', error);
    throw error;
  }
}

// Normalize item name for matching
function normalizeItemName(name) {
  if (!name) return '';

  let normalized = name.toLowerCase().trim();

  // Apply common substitutions
  for (const [from, to] of Object.entries(SUBSTITUTIONS)) {
    if (normalized.includes(from)) {
      normalized = normalized.replace(from, to);
    }
  }

  // Remove special characters (apostrophes, hyphens, etc.) for matching
  normalized = normalized.replace(/['\-]/g, '');

  return normalized;
}

// Build price lookup map
function buildPriceMap() {
  priceMap.clear();

  if (!menuData || !menuData.categories) {
    console.error('[Menu Service] Invalid menu data structure');
    return;
  }

  for (const category of menuData.categories) {
    if (!category.items) continue;

    for (const item of category.items) {
      if (!item.name || item.price === undefined) continue;

      const normalized = normalizeItemName(item.name);

      // Store with normalized key
      priceMap.set(normalized, {
        originalName: item.name,
        price: item.price,
        id: item.id,
        category: category.name,
        modifiers: item.modifiers || []
      });

      // Also store with original name (case-insensitive) for exact matches
      priceMap.set(item.name.toLowerCase().trim(), {
        originalName: item.name,
        price: item.price,
        id: item.id,
        category: category.name,
        modifiers: item.modifiers || []
      });
    }
  }
}

// Lookup price for an item
export function lookupPrice(itemName) {
  if (!itemName) {
    return { found: false, price: 0, matchedName: null };
  }

  const normalized = normalizeItemName(itemName);

  // Try exact match first (normalized)
  if (priceMap.has(normalized)) {
    const item = priceMap.get(normalized);
    return {
      found: true,
      price: item.price,
      matchedName: item.originalName,
      menuItemId: item.id,
      category: item.category
    };
  }

  // Try case-insensitive exact match
  const lowerName = itemName.toLowerCase().trim();
  if (priceMap.has(lowerName)) {
    const item = priceMap.get(lowerName);
    return {
      found: true,
      price: item.price,
      matchedName: item.originalName,
      menuItemId: item.id,
      category: item.category
    };
  }

  // Try partial matching (if query is contained in menu item)
  const partialMatches = [];
  for (const [key, item] of priceMap.entries()) {
    if (key.includes(normalized) || normalized.includes(key)) {
      partialMatches.push({ key, item, score: key.length });
    }
  }

  // If we have partial matches, use the closest one (shortest key = most specific)
  if (partialMatches.length > 0) {
    // Sort by score (prefer shorter, more specific matches)
    partialMatches.sort((a, b) => a.score - b.score);
    const bestMatch = partialMatches[0].item;

    console.log(`[Menu Service] Partial match for "${itemName}" -> "${bestMatch.originalName}"`);

    return {
      found: true,
      price: bestMatch.price,
      matchedName: bestMatch.originalName,
      menuItemId: bestMatch.id,
      category: bestMatch.category,
      partialMatch: true
    };
  }

  // No match found
  console.warn(`[Menu Service] No match found for: "${itemName}"`);
  return {
    found: false,
    price: 0,
    matchedName: null
  };
}

// Enrich order items with prices
export function enrichOrderItems(items) {
  if (!Array.isArray(items)) {
    throw new Error('Items must be an array');
  }

  const enrichedItems = [];
  const warnings = [];

  for (const item of items) {
    const result = lookupPrice(item.name);

    const enrichedItem = {
      ...item,
      unit_price: result.found ? result.price : (item.unit_price || 0),
      line_total: 0,
      matched: result.found
    };

    // Add matched name if different from original
    if (result.found && result.matchedName !== item.name) {
      enrichedItem.matched_name = result.matchedName;
      console.log(`[Menu Service] Matched "${item.name}" to "${result.matchedName}"`);
    }

    // Add menu item ID - use found ID or placeholder for unknown items
    if (result.menuItemId) {
      enrichedItem.menu_item_id = result.menuItemId;
    } else {
      // Use a placeholder ID for items not found in menu
      enrichedItem.menu_item_id = 'unknown';
    }

    // Calculate line total
    enrichedItem.line_total = parseFloat((enrichedItem.quantity * enrichedItem.unit_price).toFixed(2));

    // Add warning if not found
    if (!result.found) {
      const warning = `Item not found in menu: "${item.name}"`;
      warnings.push(warning);
      console.warn(`[Menu Service] ${warning}`);
    } else {
      console.log(`[Menu Service] Enriched "${item.name}" with price $${enrichedItem.unit_price}`);
    }

    enrichedItems.push(enrichedItem);
  }

  return { items: enrichedItems, warnings };
}

// Calculate totals for enriched items
export function calculateTotals(items, taxRate = 0.1175, orderType = 'pickup') {
  const subtotal = items.reduce((sum, item) => sum + item.line_total, 0);
  const deliveryFee = orderType === 'delivery' ? 4.00 : 0;
  const taxableAmount = subtotal + deliveryFee;
  // Delivery fee is usually taxable in many jurisdictions, asking user would be better but assuming subtotal is basis.
  // Wait, usually delivery fee is a separate line item. 
  // The user requirement said: "payload received has order type as delivery then it has to add $4.00 as the delivery fee"
  // It didn't specify if it's taxable. I'll assume tax applies to food subtotal for now as is standard unless specified.
  // Actually, usually delivery fees are taxable. But let's stick to base logic first:
  // Tax = subtotal * rate.
  // Total = subtotal + tax + deliveryFee.

  const taxAmount = subtotal * taxRate;
  const total = subtotal + taxAmount + deliveryFee;

  return {
    subtotal: parseFloat(subtotal.toFixed(2)),
    tax_amount: parseFloat(taxAmount.toFixed(2)),
    delivery_fee: parseFloat(deliveryFee.toFixed(2)),
    total: parseFloat(total.toFixed(2))
  };
}

// Get tax rate from menu
export function getTaxRate() {
  return menuData?.restaurant?.tax_rate || 0.1175;
}

// Initialize menu on module load
loadMenu();

export default {
  lookupPrice,
  enrichOrderItems,
  calculateTotals,
  getTaxRate
};
