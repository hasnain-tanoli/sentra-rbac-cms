import { RolePermission } from '../db/models/rolePermission.model';
import { PermissionInfo } from './getUserPermissions';
import mongoose from 'mongoose';

export async function getRolePermissions(
  roleId: string | mongoose.Types.ObjectId
): Promise<PermissionInfo[]> {
  const roleObjectId = typeof roleId === 'string' 
    ? new mongoose.Types.ObjectId(roleId) 
    : roleId;

  const result = await RolePermission.aggregate([
    { $match: { role_id: roleObjectId } },
    {
      $lookup: {
        from: 'permissions',
        localField: 'permission_id',
        foreignField: '_id',
        as: 'permission'
      }
    },
    { $unwind: '$permission' },
    {
      $project: {
        _id: 0,
        resource: '$permission.resource',
        action: '$permission.action',
        key: '$permission.key'
      }
    }
  ]);

  return result;
}