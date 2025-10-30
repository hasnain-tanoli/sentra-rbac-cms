import { User } from "./user";
import { Role } from "./role";

export interface UserRole {
  _id: string;
  user_id: User;
  role_id: Role;
  assignedAt: string;
}
