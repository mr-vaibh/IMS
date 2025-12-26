import { apiFetchServer } from "@/lib/api.server";
import AdjustmentTable from "@/features/adjustments/AdjustmentTable";

export default async function AdjustmentsPage() {
  const adjustments = await apiFetchServer("/inventory/adjustments");

  return (
    <div className="p-6">
      <h1 className="text-xl font-semibold mb-4">Inventory Adjustments</h1>
      <AdjustmentTable adjustments={adjustments} />
    </div>
  );
}
