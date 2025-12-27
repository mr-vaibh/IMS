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
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center">
      <div className="bg-white w-[700px] max-h-[80vh] overflow-auto rounded shadow">
        <div className="p-4 border-b flex justify-between items-center">
          <h2 className="font-semibold">
            {isCreate && "Created Record"}
            {isUpdate && "Updated Record"}
            {isDelete && "Deleted Record"}
          </h2>
          <button onClick={onClose} className="text-sm underline">
            Close
          </button>
        </div>

        <div className="p-4 text-sm">
          {/* CREATE */}
          {isCreate && (
            <table className="w-full border-collapse">
              <thead className="bg-green-50 border-b">
                <tr>
                  <th className="p-2 text-left">Field</th>
                  <th className="p-2 text-left">Value</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(newData!).map(([key, value]) => (
                  <tr key={key} className="border-b">
                    <td className="p-2 font-medium">{key}</td>
                    <td className="p-2 font-mono text-xs bg-green-50">
                      {String(value)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {/* UPDATE */}
          {isUpdate && (
            <table className="w-full border-collapse">
              <thead className="bg-gray-100 border-b">
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
                  const changed =
                    JSON.stringify(oldVal) !== JSON.stringify(newVal);

                  return (
                    <tr key={key} className="border-b">
                      <td className="p-2 font-medium">{key}</td>
                      <td
                        className={`p-2 font-mono text-xs ${
                          changed ? "bg-red-50" : ""
                        }`}
                      >
                        {oldVal === undefined ? "—" : String(oldVal)}
                      </td>
                      <td
                        className={`p-2 font-mono text-xs ${
                          changed ? "bg-green-50" : ""
                        }`}
                      >
                        {newVal === undefined ? "—" : String(newVal)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}

          {/* DELETE */}
          {isDelete && (
            <table className="w-full border-collapse">
              <thead className="bg-red-50 border-b">
                <tr>
                  <th className="p-2 text-left">Field</th>
                  <th className="p-2 text-left">Value</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(oldData!).map(([key, value]) => (
                  <tr key={key} className="border-b">
                    <td className="p-2 font-medium">{key}</td>
                    <td className="p-2 font-mono text-xs bg-red-50">
                      {String(value)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
