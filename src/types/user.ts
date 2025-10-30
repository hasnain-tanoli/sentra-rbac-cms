import { Permission } from "./permission";
import { Role } from "./role";

export interface User {
    _id: string;
    name: string;
    email: string;
    roles?: Role[];
    permissions?: Permission[];
}
