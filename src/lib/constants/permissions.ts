// lib/constants/permissions.ts
export const PERMISSION_KEYS = {
    // Dashboard
    DASHBOARD_READ: 'dashboard.read',

    // Posts
    POSTS_CREATE: 'posts.create',
    POSTS_READ: 'posts.read',
    POSTS_UPDATE: 'posts.update',
    POSTS_DELETE: 'posts.delete',

    // Users
    USERS_CREATE: 'users.create',
    USERS_READ: 'users.read',
    USERS_UPDATE: 'users.update',
    USERS_DELETE: 'users.delete',

    // Roles
    ROLES_CREATE: 'roles.create',
    ROLES_READ: 'roles.read',
    ROLES_UPDATE: 'roles.update',
    ROLES_DELETE: 'roles.delete',

    // Permissions
    PERMISSIONS_CREATE: 'permissions.create',
    PERMISSIONS_READ: 'permissions.read',
    PERMISSIONS_UPDATE: 'permissions.update',
    PERMISSIONS_DELETE: 'permissions.delete',
} as const;