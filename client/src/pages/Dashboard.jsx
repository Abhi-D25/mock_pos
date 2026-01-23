import { useState, useEffect } from 'react';
import { ordersApi } from '../services/api';
import OrderQueue from '../components/OrderQueue';
import OrderItemList from '../components/OrderItemList';
import StatusBadge from '../components/StatusBadge';
import { format } from 'date-fns';

const STATUS_FLOW = {
  pending_payment: 'paid',
  paid: 'preparing',
  preparing: 'ready',
  ready: 'completed'
};

export default function Dashboard({ orders, onOrderUpdate, addToast }) {
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    if (orders.length > 0 && !selectedOrder) {
      setSelectedOrder(orders[0]);
    }
  }, [orders, selectedOrder]);

  const handleAdvanceStatus = async () => {
    if (!selectedOrder || updating) return;

    const nextStatus = STATUS_FLOW[selectedOrder.status];
    if (!nextStatus) return;

    setUpdating(true);
    try {
      const response = await ordersApi.update(selectedOrder.id, { status: nextStatus });
      onOrderUpdate(response.order);
      setSelectedOrder(response.order);
      addToast({
        type: 'success',
        message: `Order ${selectedOrder.id} moved to ${nextStatus}`
      });
    } catch (error) {
      console.error('Error updating order:', error);
      addToast({
        type: 'error',
        message: 'Failed to update order status'
      });
    } finally {
      setUpdating(false);
    }
  };

  const handleCancelOrder = async () => {
    if (!selectedOrder || updating) return;

    if (!confirm('Are you sure you want to cancel this order?')) {
      return;
    }

    setUpdating(true);
    try {
      const response = await ordersApi.cancel(selectedOrder.id);
      onOrderUpdate(response.order);
      setSelectedOrder(response.order);
      addToast({
        type: 'success',
        message: `Order ${selectedOrder.id} cancelled`
      });
    } catch (error) {
      console.error('Error cancelling order:', error);
      addToast({
        type: 'error',
        message: 'Failed to cancel order'
      });
    } finally {
      setUpdating(false);
    }
  };

  const canAdvance = selectedOrder && STATUS_FLOW[selectedOrder.status];
  const canCancel = selectedOrder && ['pending_payment', 'paid'].includes(selectedOrder.status);

  return (
    <div className="flex h-full gap-6">
      {/* Left Panel - Order Queue */}
      <div className="w-1/3 flex flex-col">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Orders</h2>
        <OrderQueue
          orders={orders}
          selectedOrder={selectedOrder}
          onSelectOrder={setSelectedOrder}
        />
      </div>

      {/* Right Panel - Order Details */}
      <div className="flex-1 flex flex-col">
        {selectedOrder ? (
          <>
            <div className="card mb-4">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">{selectedOrder.id}</h2>
                  <p className="text-sm text-gray-500">
                    {format(new Date(selectedOrder.created_at), 'MMM d, yyyy h:mm a')}
                  </p>
                </div>
                <StatusBadge status={selectedOrder.status} />
              </div>

              {/* Customer Info */}
              <div className="bg-gray-50 rounded-lg p-4 mb-4">
                <h3 className="font-semibold text-gray-900 mb-2">Customer Information</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-600">Name</p>
                    <p className="font-medium">{selectedOrder.customer_name}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Phone</p>
                    <p className="font-medium">{selectedOrder.customer_phone}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Order Type</p>
                    <p className="font-medium capitalize">
                      {selectedOrder.order_type.replace('_', ' ')}
                    </p>
                  </div>
                  {selectedOrder.scheduled_time && (
                    <div>
                      <p className="text-gray-600">Scheduled Time</p>
                      <p className="font-medium">
                        {format(new Date(selectedOrder.scheduled_time), 'h:mm a')}
                      </p>
                    </div>
                  )}
                </div>
                {selectedOrder.special_instructions && (
                  <div className="mt-3 pt-3 border-t border-gray-200">
                    <p className="text-gray-600 text-sm mb-1">Special Instructions</p>
                    <p className="text-gray-900 italic">{selectedOrder.special_instructions}</p>
                  </div>
                )}
              </div>

              {/* Order Items */}
              <div className="mb-4">
                <h3 className="font-semibold text-gray-900 mb-3">Order Items</h3>
                <OrderItemList items={selectedOrder.items} />
              </div>

              {/* Totals */}
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Subtotal</span>
                    <span className="font-medium">${selectedOrder.subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">
                      Tax ({(selectedOrder.tax_rate * 100).toFixed(2)}%)
                    </span>
                    <span className="font-medium">${selectedOrder.tax_amount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-lg font-bold pt-2 border-t border-gray-300">
                    <span>Total</span>
                    <span>${selectedOrder.total.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* Payment Info */}
              {selectedOrder.payment_method && (
                <div className="mt-4 bg-blue-50 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900 mb-2">Payment Information</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-gray-600">Method</p>
                      <p className="font-medium capitalize">{selectedOrder.payment_method}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Payment ID</p>
                      <p className="font-medium font-mono text-xs">{selectedOrder.payment_id}</p>
                    </div>
                  </div>
                  {selectedOrder.paid_at && (
                    <div className="mt-2">
                      <p className="text-gray-600 text-xs">Paid at</p>
                      <p className="font-medium text-sm">
                        {format(new Date(selectedOrder.paid_at), 'MMM d, yyyy h:mm a')}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Actions */}
              <div className="mt-6 flex gap-3">
                {canAdvance && (
                  <button
                    onClick={handleAdvanceStatus}
                    disabled={updating}
                    className="flex-1 btn btn-primary"
                  >
                    {updating ? 'Updating...' : `Mark as ${STATUS_FLOW[selectedOrder.status].replace('_', ' ')}`}
                  </button>
                )}
                {canCancel && (
                  <button
                    onClick={handleCancelOrder}
                    disabled={updating}
                    className="btn bg-red-500 text-white hover:bg-red-600"
                  >
                    Cancel Order
                  </button>
                )}
              </div>
            </div>
          </>
        ) : (
          <div className="card flex items-center justify-center h-full">
            <div className="text-center text-gray-500">
              <p className="text-lg">No order selected</p>
              <p className="text-sm">Select an order from the queue to view details</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
