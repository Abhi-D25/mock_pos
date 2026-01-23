import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { ordersApi, paymentsApi } from '../services/api';
import PaymentForm from '../components/PaymentForm';
import OrderItemList from '../components/OrderItemList';

export default function PaymentPage() {
  const { orderId } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [paymentError, setPaymentError] = useState(null);

  useEffect(() => {
    loadOrder();
  }, [orderId]);

  const loadOrder = async () => {
    try {
      setLoading(true);
      const response = await ordersApi.getById(orderId);
      setOrder(response.order);

      if (response.order.status !== 'pending_payment') {
        if (response.order.status === 'paid' || response.order.status === 'preparing' ||
            response.order.status === 'ready' || response.order.status === 'completed') {
          setPaymentSuccess(true);
        }
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handlePayment = async (cardData) => {
    setProcessing(true);
    setPaymentError(null);

    try {
      const response = await paymentsApi.process({
        order_id: orderId,
        method: 'card',
        card: cardData
      });

      if (response.success) {
        setPaymentSuccess(true);
        await loadOrder();
      }
    } catch (err) {
      setPaymentError(err.message || 'Payment failed. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Loading order...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="card max-w-md text-center">
          <div className="text-6xl mb-4">❌</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Order Not Found</h2>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  if (paymentSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="card max-w-md text-center">
          <div className="text-6xl mb-4">✅</div>
          <h2 className="text-3xl font-bold text-green-600 mb-2">Payment Successful!</h2>
          <p className="text-gray-600 mb-4">
            Thank you for your payment. Your order has been confirmed.
          </p>
          <div className="bg-gray-50 rounded-lg p-4 mb-4">
            <p className="text-sm text-gray-600 mb-1">Order ID</p>
            <p className="text-lg font-bold text-gray-900 font-mono">{orderId}</p>
          </div>
          <p className="text-sm text-gray-600">
            You will receive updates about your order via text message.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-primary mb-2">🍜 Ming Hin Cuisine</h1>
          <p className="text-gray-600">333 E Benton Place, Chicago, IL 60601</p>
          <p className="text-gray-600">(312) 228-1333</p>
        </div>

        {/* Order Summary */}
        <div className="card mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Order Summary</h2>

          <div className="mb-4">
            <div className="flex justify-between text-sm mb-2">
              <span className="text-gray-600">Order ID</span>
              <span className="font-mono font-medium">{order.id}</span>
            </div>
            <div className="flex justify-between text-sm mb-2">
              <span className="text-gray-600">Customer</span>
              <span className="font-medium">{order.customer_name}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Order Type</span>
              <span className="font-medium capitalize">{order.order_type.replace('_', ' ')}</span>
            </div>
          </div>

          {order.special_instructions && (
            <div className="bg-blue-50 rounded-lg p-3 mb-4">
              <p className="text-sm text-gray-600 mb-1">Special Instructions</p>
              <p className="text-gray-900 italic">{order.special_instructions}</p>
            </div>
          )}

          <div className="border-t border-gray-200 pt-4 mb-4">
            <h3 className="font-semibold text-gray-900 mb-3">Items</h3>
            <OrderItemList items={order.items} />
          </div>

          <div className="bg-gray-50 rounded-lg p-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Subtotal</span>
                <span className="font-medium">${order.subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">
                  Tax ({(order.tax_rate * 100).toFixed(2)}%)
                </span>
                <span className="font-medium">${order.tax_amount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-xl font-bold pt-2 border-t-2 border-gray-300">
                <span>Total</span>
                <span className="text-primary">${order.total.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Payment Form */}
        <div className="card">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Payment Information</h2>

          {paymentError && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
              <p className="text-red-800 font-medium">❌ {paymentError}</p>
            </div>
          )}

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <p className="text-sm text-blue-900">
              <strong>Note:</strong> This is a mock payment system. No real charges will be made.
            </p>
          </div>

          <PaymentForm
            amount={order.total}
            onSubmit={handlePayment}
            loading={processing}
          />
        </div>

        {/* Footer */}
        <div className="text-center mt-8 text-sm text-gray-600">
          <p>Thank you for choosing Ming Hin Cuisine!</p>
        </div>
      </div>
    </div>
  );
}
