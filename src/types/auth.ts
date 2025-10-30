// types/auth.ts
export interface Role {
    id: string;
    title: string;
}

export interface Permission {
    id: string;
    resource: string;
    action: string;
}

export interface TokenUser {
    id: string;
    name?: string | null;
    email?: string | null;
    roles: string[];  
    permissions?: Permission[];
}
