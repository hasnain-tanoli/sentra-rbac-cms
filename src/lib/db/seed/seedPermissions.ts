import { Permission, ACTIONS, RESOURCES } from '../models/permission.model';

interface MongoError extends Error {
  code?: number;
}

export async function seedPermissions() {
  const permissions = [];

  for (const resource of RESOURCES) {
    for (const action of ACTIONS) {
      permissions.push({
        resource,
        action,
        key: `${resource}.${action}`,
        description: `Can ${action} ${resource}`
      });
    }
  }

  try {
    await Permission.insertMany(permissions, { ordered: false });
    console.log(`✅ Created ${permissions.length} permissions`);
  } catch (error) {
    const mongoError = error as MongoError;
    if (mongoError.code === 11000) {
      console.log('ℹ️  Permissions already exist');
    } else {
      throw error;
    }
  }

  return permissions;
}