import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { ordersApi, paymentsApi } from '../services/api';
import PaymentForm from '../components/PaymentForm';
import OrderItemList from '../components/OrderItemList';

const parseUtcDate = (dateString) => {
  if (!dateString) return null;
  // SQLite returns "YYYY-MM-DD HH:MM:SS" which is UTC but missing the 'Z'
  // We normalize it to ISO format "YYYY-MM-DDTHH:MM:SSZ"
  let normalized = dateString.replace(' ', 'T');

  // Check if it already has timezone info (Z or +HH:MM or -HH:MM)
  // We use a regex to look for Z or offset at the end
  const hasTimezone = /Z$|[+-]\d{2}:?\d{2}$/.test(normalized);

  if (!hasTimezone) {
    normalized += 'Z';
  }
  return new Date(normalized);
};

const formatChicagoTime = (dateString, includeTimeZone = false) => {
  const date = parseUtcDate(dateString);
  if (!date) return '';

  const options = {
    timeZone: 'America/Chicago',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  };
  if (includeTimeZone) {
    options.timeZoneName = 'short';
  }
  return date.toLocaleTimeString('en-US', options);
};

const getEstimatedPickupTime = (createdAt, items) => {
  const date = parseUtcDate(createdAt);
  if (!date || !items) return '';

  const totalItems = items.reduce((sum, item) => sum + (Number(item.quantity) || 1), 0);
  const createdTime = date.getTime();

  let minMinutes, maxMinutes;

  if (totalItems <= 3) {
    minMinutes = 20;
    maxMinutes = 25;
  } else if (totalItems <= 6) {
    minMinutes = 35;
    maxMinutes = 40;
  } else {
    // 7-10 items logic (applies to 7+ for safety)
    minMinutes = 45;
    maxMinutes = 60;
  }

  const minTime = new Date(createdTime + minMinutes * 60000);
  const maxTime = new Date(createdTime + maxMinutes * 60000);

  // Format just the time part as we are likely on the same day
  const format = (d) => d.toLocaleTimeString('en-US', {
    timeZone: 'America/Chicago',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });

  return `${format(minTime)} - ${format(maxTime)}`;
};

export default function PaymentPage() {
  const { orderId } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [paymentError, setPaymentError] = useState(null);
  const [deliveryAddress, setDeliveryAddress] = useState({
    street: '',
    city: '',
    state: '',
    zipCode: ''
  });
  const [addressErrors, setAddressErrors] = useState({});

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

  const validateAddress = () => {
    const errors = {};
    if (!deliveryAddress.street.trim()) {
      errors.street = 'Street address is required';
    }
    if (!deliveryAddress.city.trim()) {
      errors.city = 'City is required';
    }
    if (!deliveryAddress.state.trim()) {
      errors.state = 'State is required';
    }
    if (!deliveryAddress.zipCode.trim()) {
      errors.zipCode = 'ZIP code is required';
    } else if (!/^\d{5}(-\d{4})?$/.test(deliveryAddress.zipCode)) {
      errors.zipCode = 'Invalid ZIP code format';
    }
    return errors;
  };

  const handlePayment = async (cardData) => {
    setProcessing(true);
    setPaymentError(null);
    setAddressErrors({});

    // Validate address for delivery orders
    if (order.order_type === 'delivery') {
      const errors = validateAddress();
      if (Object.keys(errors).length > 0) {
        setAddressErrors(errors);
        setProcessing(false);
        setPaymentError('Please fill in all required delivery address fields.');
        return;
      }
    }

    try {
      const paymentData = {
        order_id: orderId,
        method: 'card',
        card: cardData
      };

      // Include delivery address if it's a delivery order
      if (order.order_type === 'delivery') {
        paymentData.delivery_address = deliveryAddress;
      }

      const response = await paymentsApi.process(paymentData);

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
      <div className="max-w-2xl mx-auto border-4 border-red-500 rounded-xl p-6 bg-white shadow-lg">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-primary mb-2">🍜 Ming Hin Cuisine</h1>
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
              <span className="text-gray-600">Order Created</span>
              <span className="font-medium">{formatChicagoTime(order.created_at, true)}</span>
            </div>
            <div className="flex justify-between text-sm mb-2">
              <span className="text-gray-600">Est. Pickup</span>
              <span className="font-medium">{getEstimatedPickupTime(order.created_at, order.items)}</span>
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
              {order.delivery_fee > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Delivery Fee</span>
                  <span className="font-medium">${order.delivery_fee.toFixed(2)}</span>
                </div>
              )}
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

        {/* Delivery Address Form (only for delivery orders) */}
        {order.order_type === 'delivery' && (
          <div className="card mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Delivery Address</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Street Address <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={deliveryAddress.street}
                  onChange={(e) => {
                    setDeliveryAddress(prev => ({ ...prev, street: e.target.value }));
                    if (addressErrors.street) {
                      setAddressErrors(prev => ({ ...prev, street: null }));
                    }
                  }}
                  placeholder="123 Main St"
                  className={`input ${addressErrors.street ? 'border-red-500' : ''}`}
                />
                {addressErrors.street && (
                  <p className="text-red-500 text-xs mt-1">{addressErrors.street}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    City <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={deliveryAddress.city}
                    onChange={(e) => {
                      setDeliveryAddress(prev => ({ ...prev, city: e.target.value }));
                      if (addressErrors.city) {
                        setAddressErrors(prev => ({ ...prev, city: null }));
                      }
                    }}
                    placeholder="Chicago"
                    className={`input ${addressErrors.city ? 'border-red-500' : ''}`}
                  />
                  {addressErrors.city && (
                    <p className="text-red-500 text-xs mt-1">{addressErrors.city}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    State <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={deliveryAddress.state}
                    onChange={(e) => {
                      setDeliveryAddress(prev => ({ ...prev, state: e.target.value }));
                      if (addressErrors.state) {
                        setAddressErrors(prev => ({ ...prev, state: null }));
                      }
                    }}
                    placeholder="IL"
                    className={`input ${addressErrors.state ? 'border-red-500' : ''}`}
                    maxLength="2"
                  />
                  {addressErrors.state && (
                    <p className="text-red-500 text-xs mt-1">{addressErrors.state}</p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  ZIP Code <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={deliveryAddress.zipCode}
                  onChange={(e) => {
                    setDeliveryAddress(prev => ({ ...prev, zipCode: e.target.value }));
                    if (addressErrors.zipCode) {
                      setAddressErrors(prev => ({ ...prev, zipCode: null }));
                    }
                  }}
                  placeholder="60601"
                  className={`input ${addressErrors.zipCode ? 'border-red-500' : ''}`}
                  maxLength="10"
                />
                {addressErrors.zipCode && (
                  <p className="text-red-500 text-xs mt-1">{addressErrors.zipCode}</p>
                )}
              </div>
            </div>
          </div>
        )}

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
