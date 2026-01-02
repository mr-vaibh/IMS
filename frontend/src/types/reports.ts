export interface StockReportRow {
  product_name: string;
  warehouse_name: string;
  quantity: number;
  created_at: string;
}

export interface MovementReportRow {
  product_name: string;
  warehouse_name: string;
  change: number;
  balance_after: number;
  reference_type: string;
  created_at: string;
}
