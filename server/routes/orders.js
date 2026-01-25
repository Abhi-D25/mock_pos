import express from 'express';
import {
  createOrder,
  getOrderById,
  getOrders,
  updateOrder,
  cancelOrder,
  getOrderStats
} from '../services/orderService.js';
import { notifyNewOrder, notifyOrderUpdate } from '../services/websocket.js';
import { authenticateApiKey } from '../middleware/auth.js';
import { enrichOrderItems, calculateTotals, getTaxRate } from '../services/menuService.js';

const router = express.Router();

// POST /api/orders - Create new order (Protected)
router.post('/', authenticateApiKey, async (req, res) => {
  try {
    const orderData = req.body;

    // Validate required fields
    if (!orderData.customer || !orderData.customer.name || !orderData.customer.phone) {
      return res.status(400).json({
        success: false,
        error: 'Customer name and phone are required'
      });
    }

    if (!orderData.order_type || !['pickup', 'delivery', 'dine_in'].includes(orderData.order_type)) {
      return res.status(400).json({
        success: false,
        error: 'Valid order_type is required (pickup, delivery, or dine_in)'
      });
    }

    if (!orderData.items || !Array.isArray(orderData.items) || orderData.items.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'At least one item is required'
      });
    }

    // Enrich items with prices from menu
    console.log('[Orders API] Enriching order items with menu prices...');
    const { items: enrichedItems, warnings } = enrichOrderItems(orderData.items);

    // Calculate totals using enriched items
    const taxRate = orderData.tax_rate || getTaxRate();
    const totals = calculateTotals(enrichedItems, taxRate, orderData.order_type);

    // Update order data with enriched items and calculated totals
    const enrichedOrderData = {
      ...orderData,
      items: enrichedItems,
      tax_rate: taxRate,
      ...totals
    };

    // Log warnings if any items weren't found
    if (warnings.length > 0) {
      console.warn('[Orders API] Menu matching warnings:', warnings);
    }

    // Create order
    const order = createOrder(enrichedOrderData);

    // Notify WebSocket clients
    notifyNewOrder(order);

    // Build payment URL
    const paymentUrl = `${process.env.CORS_ORIGIN}/pay/${order.id}`;

    res.status(201).json({
      success: true,
      order: {
        order_id: order.id,
        status: order.status,
        items: order.items,
        subtotal: order.subtotal,
        tax_rate: order.tax_rate,
        tax_amount: order.tax_amount,
        total: order.total,
        payment_url: paymentUrl,
        created_at: order.created_at
      },
      warnings: warnings.length > 0 ? warnings : undefined
    });
  } catch (error) {
    console.error('Error creating order:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create order',
      message: error.message
    });
  }
});

// GET /api/orders - List orders (Protected)
router.get('/', authenticateApiKey, (req, res) => {
  try {
    const filters = {
      status: req.query.status,
      order_type: req.query.order_type,
      date: req.query.date,
      limit: req.query.limit || 50,
      offset: req.query.offset || 0
    };

    const orders = getOrders(filters);

    res.json({
      success: true,
      count: orders.length,
      orders
    });
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch orders',
      message: error.message
    });
  }
});

// GET /api/orders/stats - Get order statistics (Protected)
router.get('/stats', authenticateApiKey, (req, res) => {
  try {
    const stats = getOrderStats();
    res.json({
      success: true,
      stats
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch statistics',
      message: error.message
    });
  }
});

// GET /api/orders/:id - Get single order
router.get('/:id', (req, res) => {
  try {
    const order = getOrderById(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        error: 'Order not found'
      });
    }

    res.json({
      success: true,
      order
    });
  } catch (error) {
    console.error('Error fetching order:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch order',
      message: error.message
    });
  }
});

// PUT /api/orders/:id - Update order (Protected)
router.put('/:id', authenticateApiKey, (req, res) => {
  try {
    const updates = req.body;
    const order = updateOrder(req.params.id, updates);

    if (!order) {
      return res.status(404).json({
        success: false,
        error: 'Order not found'
      });
    }

    // Notify WebSocket clients
    notifyOrderUpdate(order);

    res.json({
      success: true,
      order
    });
  } catch (error) {
    console.error('Error updating order:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update order',
      message: error.message
    });
  }
});

// DELETE /api/orders/:id - Cancel order (Protected)
router.delete('/:id', authenticateApiKey, (req, res) => {
  try {
    const order = cancelOrder(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        error: 'Order not found'
      });
    }

    // Notify WebSocket clients
    notifyOrderUpdate(order);

    res.json({
      success: true,
      message: 'Order cancelled successfully',
      order
    });
  } catch (error) {
    console.error('Error cancelling order:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to cancel order',
      message: error.message
    });
  }
});

export default router;
