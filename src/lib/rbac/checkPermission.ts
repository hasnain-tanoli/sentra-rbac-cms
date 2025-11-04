import { UserRole } from '../db/models/userRole.model';
import { Action, Resource } from '../db/models/permission.model';
import mongoose from 'mongoose';

export async function hasPermission(
  userId: string | mongoose.Types.ObjectId,
  resource: Resource,
  action: Action
): Promise<boolean> {
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
}