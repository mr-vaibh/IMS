import dynamic from "next/dynamic";

const SupplierSelect = dynamic(
  () => import("./SupplierSelect.client"),
  { ssr: false }
);

export default SupplierSelect;