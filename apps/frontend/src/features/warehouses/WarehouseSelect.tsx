import dynamic from "next/dynamic";

const WarehouseSelect = dynamic(
  () => import("./WarehouseSelect.client"),
  { ssr: false }
);

export default WarehouseSelect;
