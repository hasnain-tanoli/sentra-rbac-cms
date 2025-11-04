import { RolePermission } from '../db/models/rolePermission.model';
import { Permission } from '../db/models/permission.model';
import { MongoError, isDuplicateKeyError } from '../../types/errors';
import mongoose from 'mongoose';

export async function assignPermissionsToRole(
  roleId: string | mongoose.Types.ObjectId,
  permissionKeys: string[]
): Promise<number> {
  const roleObjectId = typeof roleId === 'string'
    ? new mongoose.Types.ObjectId(roleId)
    : roleId;

  const permissions = await Permission.find({
    key: { $in: permissionKeys }
  });

  if (permissions.length === 0) {
    throw new Error('No valid permissions found');
  }

  const docs = permissions.map(p => ({
    role_id: roleObjectId,
    permission_id: p._id
  }));

  let insertedCount = 0;
  try {
    const result = await RolePermission.insertMany(docs, {
      ordered: false
    });
    insertedCount = result.length;
  } catch (error) {
    if (isDuplicateKeyError(error)) {
      const mongoError = error as MongoError;
      insertedCount = mongoError.insertedDocs?.length || 0;
    } else {
      throw error;
    }
  }

  return insertedCount;
}