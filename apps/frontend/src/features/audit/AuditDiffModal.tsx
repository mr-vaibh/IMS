"use client";

export default function AuditDiffModal({
  open,
  onClose,
  oldData,
  newData,
}: {
  open: boolean;
  onClose: () => void;
  oldData: Record<string, any> | null;
  newData: Record<string, any> | null;
}) {
  if (!open) return null;

  const isCreate = oldData == null && newData != null;
  const isDelete = oldData != null && newData == null;
  const isUpdate = oldData != null && newData != null;

  return (
    <div className="fixed inset-0 z-50 modal-backdrop flex items-center justify-center px-4">
      <div className="modal-panel bg-white w-full max-w-3xl max-h-[80vh] overflow-auto">
        <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-[var(--primary)] to-[var(--primary-600)] text-white">
          <h2 className="font-semibold">
            {isCreate && "Created Record"}
            {isUpdate && "Updated Record"}
            {isDelete && "Deleted Record"}
          </h2>
          <button onClick={onClose} className="text-white opacity-90 hover:opacity-100">✕</button>
        </div>

        <div className="p-4 text-sm space-y-4">
          {/* CREATE */}
          {isCreate && (
            <div className="card p-3">
              <table className="w-full table-auto border-collapse">
                <thead>
                  <tr>
                    <th className="p-2 text-left">Field</th>
                    <th className="p-2 text-left">Value</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(newData!).map(([key, value]) => (
                    <tr key={key} className="border-b">
                      <td className="p-2 font-medium">{key}</td>
                      <td className="p-2 font-mono text-xs bg-green-50">{String(value)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* UPDATE */}
          {isUpdate && (
            <div className="card p-3">
              <table className="w-full table-auto border-collapse">
                <thead>
                  <tr>
                    <th className="p-2 text-left">Field</th>
                    <th className="p-2 text-left">Old</th>
                    <th className="p-2 text-left">New</th>
                  </tr>
                </thead>
                <tbody>
                  {Array.from(
                    new Set([
                      ...Object.keys(oldData!),
                      ...Object.keys(newData!),
                    ])
                  ).map((key) => {
                    const oldVal = oldData![key];
                    const newVal = newData![key];
                    const changed = JSON.stringify(oldVal) !== JSON.stringify(newVal);

                    return (
                      <tr key={key} className={`border-b ${changed ? 'bg-[rgba(96,165,250,0.02)]' : ''}`}>
                        <td className="p-2 font-medium">{key}</td>
                        <td className={`p-2 font-mono text-xs ${changed ? 'bg-red-50' : ''}`}>
                          {oldVal === undefined ? '—' : String(oldVal)}
                        </td>
                        <td className={`p-2 font-mono text-xs ${changed ? 'bg-green-50' : ''}`}>
                          {newVal === undefined ? '—' : String(newVal)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* DELETE */}
          {isDelete && (
            <div className="card p-3">
              <table className="w-full table-auto border-collapse">
                <thead>
                  <tr>
                    <th className="p-2 text-left">Field</th>
                    <th className="p-2 text-left">Value</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(oldData!).map(([key, value]) => (
                    <tr key={key} className="border-b">
                      <td className="p-2 font-medium">{key}</td>
                      <td className="p-2 font-mono text-xs bg-red-50">{String(value)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
