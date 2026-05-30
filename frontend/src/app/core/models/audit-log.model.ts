export interface AuditLogFilters {
  year?:     string;
  month?:    string;
  state?:    string;
  severity?: string;
  weather?:  string;
}

export interface AuditLog {
  _id:       string;
  userId:    string;
  userEmail: string;
  userName:  string;
  userRole:  string;
  filters:   AuditLogFilters;
  page:      string;
  createdAt: string;
}

export interface AuditLogResponse {
  data:  AuditLog[];
  total: number;
}