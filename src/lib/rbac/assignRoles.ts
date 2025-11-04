import { UserRole } from '../db/models/userRole.model';
import { Role } from '../db/models/role.model';
import { MongoError, isDuplicateKeyError } from '../../types/errors';
import mongoose from 'mongoose';

export async function assignRolesToUser(
    userId: string | mongoose.Types.ObjectId,
    roleKeys: string[]
): Promise<number> {
    const userObjectId = typeof userId === 'string'
        ? new mongoose.Types.ObjectId(userId)
        : userId;

    const roles = await Role.find({
        key: { $in: roleKeys }
    });

    if (roles.length === 0) {
        throw new Error('No valid roles found');
    }

    const docs = roles.map(r => ({
        user_id: userObjectId,
        role_id: r._id
    }));

    let insertedCount = 0;
    try {
        const result = await UserRole.insertMany(docs, { ordered: false });
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