// WarehouseSelect.tsx
import dynamic from "next/dynamic";

export default dynamic(
  () => import("./WarehouseSelect.client"),
  { ssr: false }
);
