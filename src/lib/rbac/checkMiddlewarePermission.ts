// lib/rbac/checkMiddlewarePermission.ts
import { UserRole } from '../db/models/userRole.model';
import { Action, Resource } from '../db/models/permission.model';
import mongoose from 'mongoose';
import { connectDB } from '../db/connection';

export async function hasPermission(
    userId: string | mongoose.Types.ObjectId,
    resource: Resource,
    action: Action
): Promise<boolean> {
    try {
        await connectDB();

        const userObjectId = typeof userId === 'string'
            ? new mongoose.Types.ObjectId(userId)
            : userId;

        const result = await UserRole.aggregate([
            { $match: { user_id: userObjectId } },
            {
                $lookup: {
                    from: 'rolepermissions',
                    localField: 'role_id',
                    foreignField: 'role_id',
                    as: 'role_perms'
                }
            },
            { $unwind: '$role_perms' },
            {
                $lookup: {
                    from: 'permissions',
                    localField: 'role_perms.permission_id',
                    foreignField: '_id',
                    as: 'perm'
                }
            },
            { $unwind: '$perm' },
            {
                $match: {
                    'perm.resource': resource,
                    'perm.action': action
                }
            },
            { $limit: 1 },
            { $project: { _id: 1 } }
        ]);

        return result.length > 0;
    } catch (error) {
        console.error('Error checking permission:', error);
        return false;
    }
}

// Check if user has any permissions for a resource
export async function hasAnyPermissionForResource(
    userId: string | mongoose.Types.ObjectId,
    resource: Resource
): Promise<boolean> {
    try {
        await connectDB();

        const userObjectId = typeof userId === 'string'
            ? new mongoose.Types.ObjectId(userId)
            : userId;

        const result = await UserRole.aggregate([
            { $match: { user_id: userObjectId } },
            {
                $lookup: {
                    from: 'rolepermissions',
                    localField: 'role_id',
                    foreignField: 'role_id',
                    as: 'role_perms'
                }
            },
            { $unwind: '$role_perms' },
            {
                $lookup: {
                    from: 'permissions',
                    localField: 'role_perms.permission_id',
                    foreignField: '_id',
                    as: 'perm'
                }
            },
            { $unwind: '$perm' },
            {
                $match: {
                    'perm.resource': resource
                }
            },
            { $limit: 1 },
            { $project: { _id: 1 } }
        ]);

        return result.length > 0;
    } catch (error) {
        console.error('Error checking resource permission:', error);
        return false;
    }
}

// Check if user has dashboard access (any permission)
export async function hasDashboardAccess(
    userId: string | mongoose.Types.ObjectId
): Promise<boolean> {
    try {
        await connectDB();

        const userObjectId = typeof userId === 'string'
            ? new mongoose.Types.ObjectId(userId)
            : userId;

        // Check if user has any permission at all
        const result = await UserRole.aggregate([
            { $match: { user_id: userObjectId } },
            {
                $lookup: {
                    from: 'rolepermissions',
                    localField: 'role_id',
                    foreignField: 'role_id',
                    as: 'role_perms'
                }
            },
            { $unwind: '$role_perms' },
            { $limit: 1 },
            { $project: { _id: 1 } }
        ]);

        return result.length > 0;
    } catch (error) {
        console.error('Error checking dashboard access:', error);
        return false;
    }
}

// Get all user permissions for quick checking
export async function getUserPermissionsList(
    userId: string | mongoose.Types.ObjectId
): Promise<string[]> {
    try {
        await connectDB();

        const userObjectId = typeof userId === 'string'
            ? new mongoose.Types.ObjectId(userId)
            : userId;

        const result = await UserRole.aggregate([
            { $match: { user_id: userObjectId } },
            {
                $lookup: {
                    from: 'rolepermissions',
                    localField: 'role_id',
                    foreignField: 'role_id',
                    as: 'role_perms'
                }
            },
            { $unwind: '$role_perms' },
            {
                $lookup: {
                    from: 'permissions',
                    localField: 'role_perms.permission_id',
                    foreignField: '_id',
                    as: 'perm'
                }
            },
            { $unwind: '$perm' },
            {
                $group: {
                    _id: '$perm.key',
                }
            },
            {
                $project: {
                    _id: 0,
                    key: '$_id'
                }
            }
        ]);

        return result.map(r => r.key);
    } catch (error) {
        console.error('Error getting user permissions:', error);
        return [];
    }
}