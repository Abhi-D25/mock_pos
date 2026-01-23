import { formatDistanceToNow } from 'date-fns';
import StatusBadge from './StatusBadge';

const borderColors = {
  pending_payment: 'border-l-yellow-500',
  paid: 'border-l-blue-500',
  preparing: 'border-l-orange-500',
  ready: 'border-l-green-500',
  completed: 'border-l-gray-500',
  cancelled: 'border-l-red-500'
};

export default function OrderCard({ order, onClick, isSelected }) {
  const itemCount = order.items?.length || 0;
  const timeAgo = formatDistanceToNow(new Date(order.created_at), { addSuffix: true });

  return (
    <div
      onClick={() => onClick(order)}
      className={`card cursor-pointer transition-all border-l-4 ${borderColors[order.status]} ${
        isSelected ? 'ring-2 ring-primary shadow-lg' : 'hover:shadow-lg'
      }`}
    >
      <div className="flex justify-between items-start mb-2">
        <div>
          <h3 className="font-bold text-lg text-gray-900">{order.id}</h3>
          <p className="text-sm text-gray-600">{order.customer_name}</p>
        </div>
        <StatusBadge status={order.status} />
      </div>

      <div className="flex justify-between items-center text-sm text-gray-600 mb-2">
        <span>{itemCount} {itemCount === 1 ? 'item' : 'items'}</span>
        <span className="font-semibold text-gray-900">${order.total.toFixed(2)}</span>
      </div>

      <div className="flex justify-between items-center text-xs text-gray-500">
        <span className="capitalize">{order.order_type.replace('_', ' ')}</span>
        <span>{timeAgo}</span>
      </div>
    </div>
  );
}
