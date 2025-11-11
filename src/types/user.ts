import { Permission } from "./permission";
import { Role } from "./role";

export interface User {
    _id: string;
    name: string;
    email: string;
    is_active?: boolean;
    is_system?: boolean;
    roles?: Role[];
    permissions?: Permission[];
}