import { RolePermission } from '../db/models/rolePermission.model';
import { Permission } from '../db/models/permission.model';
import { UserRole } from '../db/models/userRole.model';
import { Role } from '../db/models/role.model';
import mongoose from 'mongoose';

export async function removePermissionsFromRole(
  roleId: string | mongoose.Types.ObjectId,
  permissionKeys: string[]
): Promise<number> {
  const roleObjectId = typeof roleId === 'string' 
    ? new mongoose.Types.ObjectId(roleId) 
    : roleId;

  const permissions = await Permission.find({ key: { $in: permissionKeys } });
  const permissionIds = permissions.map(p => p._id);

  const result = await RolePermission.deleteMany({
    role_id: roleObjectId,
    permission_id: { $in: permissionIds }
  });

  return result.deletedCount;
}

export async function removeRolesFromUser(
  userId: string | mongoose.Types.ObjectId,
  roleKeys: string[]
): Promise<number> {
  const userObjectId = typeof userId === 'string' 
    ? new mongoose.Types.ObjectId(userId) 
    : userId;

  const roles = await Role.find({ key: { $in: roleKeys } });
  const roleIds = roles.map(r => r._id);

  const result = await UserRole.deleteMany({
    user_id: userObjectId,
    role_id: { $in: roleIds }
  });

  return result.deletedCount;
}