export interface Role {
    id: string;
    title: string;
}

export interface Permission {
    id: string;
    resource: string;
    action: string;
}
