"use client";

interface Item {
  product_id: string;
  sku: string;
  name: string;
  quantity: number;
}

export default function ScanBufferTable({
  items,
  onChange,
}: {
  items: Item[];
  onChange: (items: Item[]) => void;
}) {
  if (items.length === 0) {
    return (
      <p className="text-gray-500 text-sm">
        No products scanned yet
      </p>
    );
  }

  return (
    <table className="w-full border text-sm">
      <thead className="bg-gray-100">
        <tr>
          <th className="p-2 text-left">SKU</th>
          <th className="p-2 text-left">Product</th>
          <th className="p-2 text-right">Qty</th>
          <th className="p-2"></th>
        </tr>
      </thead>
      <tbody>
        {items.map((i) => (
          <tr key={i.product_id} className="border-t">
            <td className="p-2">{i.sku}</td>
            <td className="p-2">{i.name}</td>
            <td className="p-2 text-right">
              <input
                type="number"
                className="border w-16 p-1 text-right"
                value={i.quantity}
                min={1}
                onChange={(e) =>
                  onChange(
                    items.map(p =>
                      p.product_id === i.product_id
                        ? { ...p, quantity: +e.target.value }
                        : p
                    )
                  )
                }
              />
            </td>
            <td className="p-2 text-right">
              <button
                className="text-red-600"
                onClick={() =>
                  onChange(
                    items.filter(p => p.product_id !== i.product_id)
                  )
                }
              >
                ✕
              </button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
