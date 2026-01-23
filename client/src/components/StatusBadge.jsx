const statusConfig = {
  pending_payment: {
    label: 'Pending Payment',
    className: 'bg-yellow-100 text-yellow-800 border border-yellow-200'
  },
  paid: {
    label: 'Paid',
    className: 'bg-blue-100 text-blue-800 border border-blue-200'
  },
  preparing: {
    label: 'Preparing',
    className: 'bg-orange-100 text-orange-800 border border-orange-200'
  },
  ready: {
    label: 'Ready',
    className: 'bg-green-100 text-green-800 border border-green-200'
  },
  completed: {
    label: 'Completed',
    className: 'bg-gray-100 text-gray-800 border border-gray-200'
  },
  cancelled: {
    label: 'Cancelled',
    className: 'bg-red-100 text-red-800 border border-red-200'
  }
};

export default function StatusBadge({ status }) {
  const config = statusConfig[status] || {
    label: status,
    className: 'bg-gray-100 text-gray-800 border border-gray-200'
  };

  return (
    <span className={`badge ${config.className}`}>
      {config.label}
    </span>
  );
}
