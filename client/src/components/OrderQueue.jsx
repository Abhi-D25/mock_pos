import { useState } from 'react';
import OrderCard from './OrderCard';

const FILTER_TABS = [
  { id: 'all', label: 'All' },
  { id: 'pending_payment', label: 'Pending Payment' },
  { id: 'paid', label: 'Paid' },
  { id: 'preparing', label: 'Preparing' },
  { id: 'ready', label: 'Ready' }
];

export default function OrderQueue({ orders, selectedOrder, onSelectOrder }) {
  const [activeFilter, setActiveFilter] = useState('all');

  const filteredOrders = activeFilter === 'all'
    ? orders
    : orders.filter(order => order.status === activeFilter);

  return (
    <div className="flex flex-col h-full">
      <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
        {FILTER_TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveFilter(tab.id)}
            className={`px-4 py-2 rounded-lg whitespace-nowrap transition-colors ${
              activeFilter === tab.id
                ? 'bg-primary text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto space-y-3">
        {filteredOrders.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            <p className="text-lg">No orders found</p>
            <p className="text-sm">Orders will appear here when they are created</p>
          </div>
        ) : (
          filteredOrders.map(order => (
            <OrderCard
              key={order.id}
              order={order}
              onClick={onSelectOrder}
              isSelected={selectedOrder?.id === order.id}
            />
          ))
        )}
      </div>
    </div>
  );
}
