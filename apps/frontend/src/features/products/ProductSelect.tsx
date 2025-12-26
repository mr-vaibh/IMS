import dynamic from "next/dynamic";

const ProductSelect = dynamic(
  () => import("./ProductSelect.client"),
  { ssr: false }
);

export default ProductSelect;
