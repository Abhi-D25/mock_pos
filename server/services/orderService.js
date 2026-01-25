import Database from 'better-sqlite3';
import { v4 as uuidv4 } from 'uuid';
import dotenv from 'dotenv';

dotenv.config();

const dbPath = process.env.DATABASE_PATH || './server/database/pos.db';
const db = new Database(dbPath);
db.pragma('foreign_keys = ON');

// Generate order ID in format: ORD-YYYYMMDD-XXXX
function generateOrderId() {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const dateStr = `${year}${month}${day}`;

  // Get count of orders today
  const todayStart = `${year}-${month}-${day} 00:00:00`;
  const countStmt = db.prepare(`
    SELECT COUNT(*) as count
    FROM orders
    WHERE created_at >= ?
  `);
  const result = countStmt.get(todayStart);
  const orderNumber = String((result.count || 0) + 1).padStart(4, '0');

  return `ORD-${dateStr}-${orderNumber}`;
}

// Calculate totals
function calculateOrderTotals(items, taxRate = 0.1175, orderType = 'pickup') {
  const subtotal = items.reduce((sum, item) => {
    return sum + (item.quantity * item.unit_price);
  }, 0);

  const deliveryFee = orderType === 'delivery' ? 4.00 : 0;
  const taxAmount = subtotal * taxRate;
  const total = subtotal + taxAmount + deliveryFee;

  return {
    subtotal: parseFloat(subtotal.toFixed(2)),
    tax_amount: parseFloat(taxAmount.toFixed(2)),
    delivery_fee: parseFloat(deliveryFee.toFixed(2)),
    total: parseFloat(total.toFixed(2))
  };
}

// Create a new order
export function createOrder(orderData) {
  const orderId = generateOrderId();
  const { subtotal, tax_amount, delivery_fee, total } = calculateOrderTotals(
    orderData.items,
    orderData.tax_rate || 0.1175,
    orderData.order_type
  );

  const insertOrder = db.prepare(`
    INSERT INTO orders (
      id, source, customer_name, customer_phone, order_type,
      scheduled_time, special_instructions, subtotal, tax_rate,
      tax_amount, delivery_fee, total, status, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
  `);

  const insertOrderItem = db.prepare(`
    INSERT INTO order_items (
      order_id, menu_item_id, name, quantity, unit_price,
      modifiers, notes, line_total
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const transaction = db.transaction(() => {
    // Insert order
    insertOrder.run(
      orderId,
      orderData.source || 'ai_voice_agent',
      orderData.customer.name,
      orderData.customer.phone,
      orderData.order_type,
      orderData.scheduled_time || null,
      orderData.special_instructions || null,
      subtotal,
      orderData.tax_rate || 0.1175,
      tax_amount,
      delivery_fee,
      total,
      'pending_payment'
    );

    // Insert order items
    for (const item of orderData.items) {
      const lineTotal = item.quantity * item.unit_price;
      insertOrderItem.run(
        orderId,
        item.menu_item_id,
        item.name,
        item.quantity,
        item.unit_price,
        item.modifiers ? JSON.stringify(item.modifiers) : null,
        item.notes || null,
        lineTotal
      );
    }
  });

  transaction();

  return getOrderById(orderId);
}

// Get order by ID
export function getOrderById(orderId) {
  const orderStmt = db.prepare('SELECT * FROM orders WHERE id = ?');
  const order = orderStmt.get(orderId);

  if (!order) {
    return null;
  }

  const itemsStmt = db.prepare('SELECT * FROM order_items WHERE order_id = ?');
  const items = itemsStmt.all(orderId);

  // Parse modifiers JSON
  const parsedItems = items.map(item => ({
    ...item,
    modifiers: item.modifiers ? JSON.parse(item.modifiers) : []
  }));

  return {
    ...order,
    items: parsedItems
  };
}

// Get all orders with filters
export function getOrders(filters = {}) {
  let query = 'SELECT * FROM orders WHERE 1=1';
  const params = [];

  if (filters.status) {
    query += ' AND status = ?';
    params.push(filters.status);
  }

  if (filters.order_type) {
    query += ' AND order_type = ?';
    params.push(filters.order_type);
  }

  if (filters.date) {
    query += ' AND DATE(created_at) = ?';
    params.push(filters.date);
  }

  query += ' ORDER BY created_at DESC';

  if (filters.limit) {
    query += ' LIMIT ?';
    params.push(parseInt(filters.limit));
  }

  if (filters.offset) {
    query += ' OFFSET ?';
    params.push(parseInt(filters.offset));
  }

  const stmt = db.prepare(query);
  const orders = stmt.all(...params);

  // Get items for each order
  return orders.map(order => {
    const itemsStmt = db.prepare('SELECT * FROM order_items WHERE order_id = ?');
    const items = itemsStmt.all(order.id);
    const parsedItems = items.map(item => ({
      ...item,
      modifiers: item.modifiers ? JSON.parse(item.modifiers) : []
    }));

    return {
      ...order,
      items: parsedItems
    };
  });
}

// Update order
export function updateOrder(orderId, updates) {
  const allowedFields = ['status', 'special_instructions', 'scheduled_time', 'payment_method', 'payment_id', 'paid_at'];
  const fields = [];
  const values = [];

  for (const [key, value] of Object.entries(updates)) {
    if (allowedFields.includes(key)) {
      fields.push(`${key} = ?`);
      values.push(value);
    }
  }

  if (fields.length === 0) {
    throw new Error('No valid fields to update');
  }

  fields.push('updated_at = datetime(\'now\')');
  values.push(orderId);

  const query = `UPDATE orders SET ${fields.join(', ')} WHERE id = ?`;
  const stmt = db.prepare(query);
  const result = stmt.run(...values);

  if (result.changes === 0) {
    return null;
  }

  return getOrderById(orderId);
}

// Cancel order
export function cancelOrder(orderId) {
  return updateOrder(orderId, { status: 'cancelled' });
}

// Get order statistics
export function getOrderStats() {
  const stats = {
    total_orders: 0,
    pending_payment: 0,
    paid: 0,
    preparing: 0,
    ready: 0,
    completed: 0,
    cancelled: 0,
    total_revenue: 0
  };

  const countStmt = db.prepare('SELECT status, COUNT(*) as count FROM orders GROUP BY status');
  const counts = countStmt.all();

  counts.forEach(row => {
    stats[row.status] = row.count;
    stats.total_orders += row.count;
  });

  const revenueStmt = db.prepare('SELECT SUM(total) as revenue FROM orders WHERE status IN (?, ?, ?, ?)');
  const revenue = revenueStmt.get('paid', 'preparing', 'ready', 'completed');
  stats.total_revenue = revenue.revenue || 0;

  return stats;
}

export default {
  createOrder,
  getOrderById,
  getOrders,
  updateOrder,
  cancelOrder,
  getOrderStats
};
