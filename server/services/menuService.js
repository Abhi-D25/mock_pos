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

// Calculate token-based similarity between two strings
// Returns a score between 0 and 1, where 1 is perfect match
function calculateTokenSimilarity(str1, str2) {
  if (!str1 || !str2) return 0;

  // Tokenize: split by spaces and common delimiters
  const tokens1 = str1.toLowerCase().split(/[\s\-_]+/).filter(t => t.length > 0);
  const tokens2 = str2.toLowerCase().split(/[\s\-_]+/).filter(t => t.length > 0);

  if (tokens1.length === 0 || tokens2.length === 0) return 0;

  // Count exact and partial matches with different weights
  let exactMatches = 0;
  let partialMatches = 0;

  for (const token1 of tokens1) {
    let foundExact = false;
    let foundPartial = false;

    for (const token2 of tokens2) {
      if (token1 === token2) {
        foundExact = true;
        break;
      } else if (token1.length > 2 && token2.length > 2) {
        // For partial matches, require significant overlap (longer token contains shorter)
        if (token2.includes(token1) || token1.includes(token2)) {
          // Only count if the match is substantial (>70% of shorter token)
          const shorter = Math.min(token1.length, token2.length);
          const longer = Math.max(token1.length, token2.length);
          if (shorter / longer >= 0.7) {
            foundPartial = true;
          }
        }
      }
    }

    if (foundExact) {
      exactMatches++;
    } else if (foundPartial) {
      partialMatches++;
    }
  }

  // Weight exact matches more heavily than partial matches
  // Exact match = 1.0, Partial match = 0.5
  const totalScore = exactMatches + (partialMatches * 0.5);
  const maxScore = tokens1.length;

  return totalScore / maxScore;
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

  // Try fuzzy matching using token-based similarity
  const fuzzyMatches = [];
  const SIMILARITY_THRESHOLD = 0.65; // 65% token match required

  for (const [key, item] of priceMap.entries()) {
    // First try simple substring containment for backwards compatibility
    if (key.includes(normalized) || normalized.includes(key)) {
      fuzzyMatches.push({
        key,
        item,
        similarity: 0.95, // High score for substring matches
        matchType: 'substring'
      });
      continue;
    }

    // Calculate token-based similarity using original names
    const similarity = calculateTokenSimilarity(itemName, item.originalName);

    if (similarity >= SIMILARITY_THRESHOLD) {
      fuzzyMatches.push({
        key,
        item,
        similarity,
        matchType: 'token'
      });
    }
  }

  // If we have fuzzy matches, use the best one (highest similarity)
  if (fuzzyMatches.length > 0) {
    // Sort by similarity (descending), then by key length (ascending) for ties
    fuzzyMatches.sort((a, b) => {
      if (Math.abs(a.similarity - b.similarity) > 0.01) {
        return b.similarity - a.similarity; // Higher similarity first
      }
      return a.key.length - b.key.length; // Shorter/more specific first
    });

    const bestMatch = fuzzyMatches[0];
    const matchTypeLabel = bestMatch.matchType === 'substring' ? 'Partial' : 'Fuzzy';

    console.log(
      `[Menu Service] ${matchTypeLabel} match for "${itemName}" -> "${bestMatch.item.originalName}" ` +
      `(similarity: ${(bestMatch.similarity * 100).toFixed(1)}%)`
    );

    return {
      found: true,
      price: bestMatch.item.price,
      matchedName: bestMatch.item.originalName,
      menuItemId: bestMatch.item.id,
      category: bestMatch.item.category,
      partialMatch: true,
      similarity: bestMatch.similarity
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
