export interface AuditLog {
  id: string;
  entity: string;
  entity_id: string;
  action: "CREATE" | "UPDATE" | "DELETE";
  actor_id: string | null;
  created_at: string;
  old_data?: Record<string, any> | null;
  new_data?: Record<string, any> | null;
}
