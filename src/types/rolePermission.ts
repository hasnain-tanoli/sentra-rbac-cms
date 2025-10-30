import { Role } from "./role";
import { Permission } from "./permission";

export interface RolePermission {
  _id: string;
  role_id: Role;
  permission_id: Permission;
  createdAt?: string;
  updatedAt?: string;
}
