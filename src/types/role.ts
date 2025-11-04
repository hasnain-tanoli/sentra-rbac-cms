import { Permission } from "./permission";

export interface Role {
  _id: string;
  title: string;
  key: string;
  description?: string;
  permissions?: Permission[];
}
