import dynamic from "next/dynamic";

const CompanySelect = dynamic(
  () => import("./CompanySelect.client"),
  { ssr: false }
);

export default CompanySelect;
