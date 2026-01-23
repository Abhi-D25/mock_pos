import Database from 'better-sqlite3';
import { v4 as uuidv4 } from 'uuid';
import dotenv from 'dotenv';
import { updateOrder } from './orderService.js';

dotenv.config();

const dbPath = process.env.DATABASE_PATH || './server/database/pos.db';
const db = new Database(dbPath);
db.pragma('foreign_keys = ON');

// Validate card number (basic format check)
function validateCardNumber(cardNumber) {
  const cleaned = cardNumber.replace(/\s/g, '');

  // Must be 13-19 digits
  if (!/^\d{13,19}$/.test(cleaned)) {
    return false;
  }

  // Optional: Luhn algorithm check
  let sum = 0;
  let isEven = false;

  for (let i = cleaned.length - 1; i >= 0; i--) {
    let digit = parseInt(cleaned[i]);

    if (isEven) {
      digit *= 2;
      if (digit > 9) {
        digit -= 9;
      }
    }

    sum += digit;
    isEven = !isEven;
  }

  return sum % 10 === 0;
}

// Detect card brand
function detectCardBrand(cardNumber) {
  const cleaned = cardNumber.replace(/\s/g, '');

  if (/^4/.test(cleaned)) {
    return 'visa';
  } else if (/^5[1-5]/.test(cleaned)) {
    return 'mastercard';
  } else if (/^3[47]/.test(cleaned)) {
    return 'amex';
  } else if (/^6(?:011|5)/.test(cleaned)) {
    return 'discover';
  }

  return 'unknown';
}

// Simulate payment processing
async function simulatePaymentProcessing(cardNumber) {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 2000));

  const cleaned = cardNumber.replace(/\s/g, '');

  // Test card numbers
  const testCards = {
    '4242424242424242': 'success', // Visa
    '5555555555554444': 'success', // Mastercard
    '378282246310005': 'success',  // Amex
    '4000000000000002': 'declined'  // Declined
  };

  if (testCards[cleaned]) {
    return testCards[cleaned] === 'success';
  }

  // For other cards, succeed if valid format
  return validateCardNumber(cardNumber);
}

// Process payment
export async function processPayment(paymentData) {
  const { order_id, method, card } = paymentData;

  // Verify order exists
  const orderStmt = db.prepare('SELECT * FROM orders WHERE id = ?');
  const order = orderStmt.get(order_id);

  if (!order) {
    throw new Error('Order not found');
  }

  if (order.status !== 'pending_payment') {
    throw new Error(`Order cannot be paid. Current status: ${order.status}`);
  }

  let paymentStatus = 'completed';
  let cardLastFour = null;
  let cardBrand = null;

  if (method === 'card') {
    if (!card || !card.number) {
      throw new Error('Card information is required');
    }

    // Validate card
    if (!validateCardNumber(card.number)) {
      throw new Error('Invalid card number');
    }

    // Simulate payment processing
    const success = await simulatePaymentProcessing(card.number);

    if (!success) {
      paymentStatus = 'failed';
    }

    cardLastFour = card.number.replace(/\s/g, '').slice(-4);
    cardBrand = detectCardBrand(card.number);
  }

  // Generate payment ID
  const paymentId = `PAY-${uuidv4().split('-')[0]}`;

  // Insert payment record
  const insertPayment = db.prepare(`
    INSERT INTO payments (
      id, order_id, amount, method, card_last_four,
      card_brand, status, processed_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))
  `);

  insertPayment.run(
    paymentId,
    order_id,
    order.total,
    method,
    cardLastFour,
    cardBrand,
    paymentStatus
  );

  // Update order if payment successful
  if (paymentStatus === 'completed') {
    updateOrder(order_id, {
      status: 'paid',
      payment_method: method,
      payment_id: paymentId,
      paid_at: new Date().toISOString()
    });
  }

  // Get payment record
  const payment = db.prepare('SELECT * FROM payments WHERE id = ?').get(paymentId);

  return {
    ...payment,
    success: paymentStatus === 'completed'
  };
}

// Get payment by ID
export function getPaymentById(paymentId) {
  const stmt = db.prepare('SELECT * FROM payments WHERE id = ?');
  return stmt.get(paymentId);
}

// Get payments for an order
export function getPaymentsByOrderId(orderId) {
  const stmt = db.prepare('SELECT * FROM payments WHERE order_id = ? ORDER BY processed_at DESC');
  return stmt.all(orderId);
}

// Refund payment (mock)
export function refundPayment(paymentId) {
  const updateStmt = db.prepare('UPDATE payments SET status = ? WHERE id = ?');
  const result = updateStmt.run('refunded', paymentId);

  if (result.changes === 0) {
    throw new Error('Payment not found');
  }

  return getPaymentById(paymentId);
}

export default {
  processPayment,
  getPaymentById,
  getPaymentsByOrderId,
  refundPayment
};
