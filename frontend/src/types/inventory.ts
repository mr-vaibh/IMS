export interface InventoryRow {
  product_id: string;
  product_name: string;
  warehouse_id: string;
  warehouse_name: string;
  supplier_id?: string;
  supplier_name?: string;
  quantity: number;
}
