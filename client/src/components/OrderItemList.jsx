export default function OrderItemList({ items }) {
  return (
    <div className="space-y-3">
      {items.map((item, index) => (
        <div key={index} className="border-b border-gray-200 pb-3 last:border-b-0">
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="font-medium text-gray-900">
                  {item.quantity}x {item.name}
                </span>
              </div>

              {item.modifiers && item.modifiers.length > 0 && (
                <div className="mt-1 ml-4 text-sm text-gray-600">
                  {item.modifiers.map((modifier, idx) => (
                    <div key={idx}>• {modifier.name}: {modifier.value}</div>
                  ))}
                </div>
              )}

              {item.notes && (
                <div className="mt-1 ml-4 text-sm italic text-gray-500">
                  Note: {item.notes}
                </div>
              )}
            </div>

            <div className="text-right">
              <div className="font-medium text-gray-900">
                ${item.line_total.toFixed(2)}
              </div>
              <div className="text-xs text-gray-500">
                ${item.unit_price.toFixed(2)} each
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
