// ProductSelect.tsx
import dynamic from "next/dynamic";

export default dynamic(
  () => import("./ProductSelect.client"),
  { ssr: false }
);
