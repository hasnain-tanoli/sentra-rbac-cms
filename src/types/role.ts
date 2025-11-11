import { Permission } from "./permission";

export interface Role {
  _id: string;
  title: string;
  key: string;
  description?: string;
  is_system?: boolean;
  permissions?: Permission[];
  created_at: Date;
  updated_at: Date;
}