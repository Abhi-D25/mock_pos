import express from 'express';
import {
  processPayment,
  getPaymentById,
  getPaymentsByOrderId,
  refundPayment
} from '../services/paymentService.js';
import { getOrderById } from '../services/orderService.js';
import { notifyPaymentReceived } from '../services/websocket.js';

const router = express.Router();

// POST /api/payments - Process payment
router.post('/', async (req, res) => {
  try {
    const paymentData = req.body;

    // Validate required fields
    if (!paymentData.order_id) {
      return res.status(400).json({
        success: false,
        error: 'order_id is required'
      });
    }

    if (!paymentData.method || !['card', 'cash', 'other'].includes(paymentData.method)) {
      return res.status(400).json({
        success: false,
        error: 'Valid payment method is required (card, cash, or other)'
      });
    }

    if (paymentData.method === 'card') {
      if (!paymentData.card || !paymentData.card.number || !paymentData.card.exp_month ||
          !paymentData.card.exp_year || !paymentData.card.cvc || !paymentData.card.name) {
        return res.status(400).json({
          success: false,
          error: 'Complete card information is required'
        });
      }
    }

    // Process payment
    const payment = await processPayment(paymentData);

    if (payment.status === 'failed') {
      return res.status(402).json({
        success: false,
        error: 'Payment declined',
        payment: {
          payment_id: payment.id,
          order_id: payment.order_id,
          amount: payment.amount,
          status: payment.status
        }
      });
    }

    // Get updated order
    const order = getOrderById(paymentData.order_id);

    // Notify WebSocket clients
    notifyPaymentReceived(payment, order);

    res.json({
      success: true,
      payment: {
        payment_id: payment.id,
        order_id: payment.order_id,
        amount: payment.amount,
        status: payment.status,
        card_last_four: payment.card_last_four,
        card_brand: payment.card_brand
      }
    });
  } catch (error) {
    console.error('Error processing payment:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to process payment',
      message: error.message
    });
  }
});

// GET /api/payments/:id - Get payment by ID
router.get('/:id', (req, res) => {
  try {
    const payment = getPaymentById(req.params.id);

    if (!payment) {
      return res.status(404).json({
        success: false,
        error: 'Payment not found'
      });
    }

    res.json({
      success: true,
      payment
    });
  } catch (error) {
    console.error('Error fetching payment:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch payment',
      message: error.message
    });
  }
});

// GET /api/payments/order/:orderId - Get payments for an order
router.get('/order/:orderId', (req, res) => {
  try {
    const payments = getPaymentsByOrderId(req.params.orderId);

    res.json({
      success: true,
      count: payments.length,
      payments
    });
  } catch (error) {
    console.error('Error fetching payments:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch payments',
      message: error.message
    });
  }
});

// POST /api/payments/:id/refund - Refund payment
router.post('/:id/refund', (req, res) => {
  try {
    const payment = refundPayment(req.params.id);

    res.json({
      success: true,
      message: 'Payment refunded successfully',
      payment
    });
  } catch (error) {
    console.error('Error refunding payment:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to refund payment',
      message: error.message
    });
  }
});

export default router;
