import { UserRole } from '../db/models/userRole.model';
import mongoose from 'mongoose';

export interface PermissionInfo {
  key: string;
  resource: string;
  action: string;
}

export async function getUserPermissions(
  userId: string | mongoose.Types.ObjectId
): Promise<PermissionInfo[]> {
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
        _id: '$perm._id',
        key: { $first: '$perm.key' },
        resource: { $first: '$perm.resource' },
        action: { $first: '$perm.action' }
      }
    },
    {
      $project: {
        _id: 0,
        key: 1,
        resource: 1,
        action: 1
      }
    }
  ]);

  return result;
}