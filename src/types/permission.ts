export interface Permission {
  _id: string;
  resource: string;
  action: string;
  key: string;
  description?: string;
  is_system?: boolean;
}