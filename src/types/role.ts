import { Permission } from "./permission";

export interface Role {
  _id: string;
  title: string;
  description?: string;
  permissions?: Permission[];
}
