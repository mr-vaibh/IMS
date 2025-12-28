export interface AuditLog {
  id: string;
  entity: string;
  entity_id: string;
  action: "CREATE" | "UPDATE" | "DELETE";
  actor: any | null;
  time: string;
  old_data?: Record<string, any> | null;
  new_data?: Record<string, any> | null;
}
